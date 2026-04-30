# Testing and deployment

## Hardhat plugin baseline

Enable the FHEVM Hardhat plugin in `hardhat.config.ts`:

```ts
import "@fhevm/hardhat-plugin";
```

Without that import, the `fhevm` helpers are not available in the Hardhat Runtime Environment.

## Test modes

Use the right mode for the stage of work:

- Hardhat in-memory: fastest, mock encryption, ideal for unit tests and CI
- Hardhat node on localhost: still mock-based, but persistent and useful for frontend integration work
- Sepolia: real end-to-end protocol validation before production assumptions

## Core testing pattern

1. Deploy the contract.
2. Create encrypted inputs with the Hardhat `fhevm` API.
3. Call the contract with `handles[n]` and `inputProof`.
4. Read ciphertext handles back from the contract.
5. Decrypt expected handles with `fhevm.userDecryptEuint` or the matching helper.

Example skeleton:

```ts
import { ethers, fhevm } from "hardhat";
import { FhevmType } from "@fhevm/hardhat-plugin";

const input = fhevm.createEncryptedInput(contractAddress, signer.address);
input.add32(12345);
const encrypted = await input.encrypt();

await contract.foo(encrypted.handles[0], encrypted.inputProof);

const handle = await contract.someHandle();
const clear = await fhevm.userDecryptEuint(
  FhevmType.euint32,
  handle,
  contractAddress,
  signer,
);
```

## What to assert in tests

- encrypted inputs were accepted with the correct proof
- ACL was set so the intended actor can decrypt
- the decrypted outcome matches business logic
- repeat calls preserve confidentiality rules and role checks
- public-reveal logic only happens when intended

## Deployment workflow

For new repositories, deploy from the official Hardhat template and keep deployment scripts simple:

```bash
npx hardhat test
npx hardhat node
npx hardhat run scripts/deploy.ts --network localhost
npx hardhat run scripts/deploy.ts --network sepolia
```

Before Sepolia deployment:

- set `MNEMONIC`
- set `INFURA_API_KEY` or the RPC setting used by the project
- confirm the contract inherits `ZamaEthereumConfig`
- confirm no contract addresses are hardcoded
- confirm all constructor args are deterministic and explicit

## Release checklist

Before calling a contract production-ready:

- tests pass locally in mock mode
- the same flows are validated on Sepolia when the project will leave local development
- frontend encryption and decryption are exercised against the deployed ABI
- the privacy model is documented clearly for users

## CI guidance

In CI, favor the fast mock-mode Hardhat tests first. Treat Sepolia or other network validation as an additional gated stage, not as the only source of correctness.