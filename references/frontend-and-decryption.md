# Frontend and decryption

## Current client package

For current frontend integration, prefer `@zama-fhe/relayer-sdk`. Older examples may mention `fhevmjs`, but that should be treated as a migration clue rather than the default path.

## Initialize the relayer SDK

Sepolia example:

```ts
import { createInstance, SepoliaConfig } from "@zama-fhe/relayer-sdk";

const instance = await createInstance({
  ...SepoliaConfig,
  network: window.ethereum,
});
```

The `network` field is required. It can be an RPC URL string or an EIP-1193 provider such as `window.ethereum`.

## Encrypt fresh inputs

Create an encrypted input buffer tied to:

- the contract address that will import the ciphertext
- the user address allowed to submit it

```ts
const buffer = instance.createEncryptedInput(contractAddress, userAddress);
buffer.addBool(true);
buffer.add64(42n);

const encryptedInputs = await buffer.encrypt();

await contract.castVote(encryptedInputs.handles[0], encryptedInputs.inputProof);
```

Use the `add...` method that matches the target Solidity type:

- `addBool`
- `add8`
- `add16`
- `add32`
- `add64`
- `add128`
- `add256`
- `addAddress`

## User decryption flow

User decryption is an offchain re-encryption flow. The contract exposes a ciphertext handle through a `view` function, and the frontend requests re-encryption to the user's NaCl keypair.

```ts
const keypair = instance.generateKeypair();
const startTimestamp = Math.floor(Date.now() / 1000).toString();
const durationDays = "1";
const contractAddresses = [contractAddress];

const eip712 = instance.createEIP712(
  keypair.publicKey,
  contractAddresses,
  startTimestamp,
  durationDays,
);

const signature = await signer.signTypedData(
  eip712.domain,
  {
    UserDecryptRequestVerification: eip712.types.UserDecryptRequestVerification,
  },
  eip712.message,
);

const result = await instance.userDecrypt(
  [{ handle: ciphertextHandle, contractAddress }],
  keypair.privateKey,
  keypair.publicKey,
  signature.replace("0x", ""),
  contractAddresses,
  userAddress,
  startTimestamp,
  durationDays,
);

const clearValue = result[ciphertextHandle];
```

This only works if the contract has granted ACL access with `FHE.allow(ciphertext, userAddress)` or an equivalent supported flow.

## Public decryption flow

Public decryption is for values the contract explicitly wants to reveal to everyone.

Contract side:

```solidity
FHE.makePubliclyDecryptable(resultHandle);
```

Frontend side:

```ts
const results = await instance.publicDecrypt([resultHandle]);
const clearValue = results.clearValues[resultHandle];
const decryptionProof = results.decryptionProof;
```

If the clear value must be verified onchain, pass the proof back into a contract function and verify it with `FHE.checkSignatures`.

## Bit-length limit

The total bit length of all ciphertexts in a single user or public decryption request must not exceed 2048 bits.

Examples:

- 32 values of `euint64` are too large
- 32 values of `euint32` fit exactly
- a mixed batch must be counted explicitly

## Frontend rules

- never encrypt inside the contract; fresh encryption is always offchain
- never assume a ciphertext handle is user-readable without ACL
- do not hardcode relayer or verifier addresses when the SDK already ships `SepoliaConfig` or `MainnetConfig`
- for mainnet, budget for API-key based access if the relayer requires it
- if a request involves a browser wallet, prefer an EIP-1193 provider passed directly into `createInstance`