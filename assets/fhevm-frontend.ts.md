# Frontend relayer integration template

```ts
import { BrowserProvider, Contract } from "ethers";
import { createInstance, SepoliaConfig } from "@zama-fhe/relayer-sdk";

declare global {
  interface Window {
    ethereum?: unknown;
  }
}

function getProvider() {
  if (!window.ethereum) {
    throw new Error("An EIP-1193 wallet is required");
  }

  return new BrowserProvider(window.ethereum as any);
}

async function getInstance() {
  if (!window.ethereum) {
    throw new Error("An EIP-1193 wallet is required");
  }

  return createInstance({
    ...SepoliaConfig,
    network: window.ethereum as any,
  });
}

export async function castEncryptedVote(
  contractAddress: string,
  contractAbi: readonly unknown[],
  support: boolean,
) {
  const provider = getProvider();
  const signer = await provider.getSigner();
  const userAddress = await signer.getAddress();
  const instance = await getInstance();
  const contract = new Contract(contractAddress, contractAbi, signer);

  const buffer = instance.createEncryptedInput(contractAddress, userAddress);
  buffer.addBool(support);
  const encrypted = await buffer.encrypt();

  const tx = await contract.castVote(encrypted.handles[0], encrypted.inputProof);
  await tx.wait();
}

export async function decryptUserHandle(
  contractAddress: string,
  ciphertextHandle: string,
) {
  const provider = getProvider();
  const signer = await provider.getSigner();
  const userAddress = await signer.getAddress();
  const instance = await getInstance();

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

  return result[ciphertextHandle];
}

export async function decryptPublicHandles(handles: string[]) {
  const instance = await getInstance();
  const result = await instance.publicDecrypt(handles);
  return result.clearValues;
}
```

Notes:

- user decryption requires contract-side ACL access for the requesting user
- public decryption requires the contract to have called `FHE.makePubliclyDecryptable`
- keep each decryption batch under 2048 total bits