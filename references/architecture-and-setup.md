# Architecture and setup

## How FHEVM works onchain

Zama FHEVM lets Solidity contracts manipulate encrypted values without learning their plaintext. The main moving pieces are:

- ciphertext handles stored in contract state or returned from `view` functions
- the FHE coprocessor, which evaluates encrypted operations on behalf of the EVM
- the ACL, which decides who can reuse or decrypt ciphertexts
- the relayer, which registers fresh encrypted inputs and serves decryption flows
- the KMS and verifier contracts, which authorize user or public decryption flows

The contract never receives plaintext for a fresh confidential input. The user encrypts locally, the relayer registers the ciphertext, and the contract imports the handle with `FHE.fromExternal`.

## Bootstrap a new project

Use the official Hardhat template as the default starting point for any new project:

1. Install an even-numbered Node.js LTS release such as `v18.x` or `v20.x`.
2. Create a repository from `zama-ai/fhevm-hardhat-template`.
3. Clone it locally and run `npm install`.
4. If Sepolia deployment is needed, set Hardhat vars for `MNEMONIC` and `INFURA_API_KEY`.
5. Confirm `hardhat.config.ts` imports `@fhevm/hardhat-plugin`.

Recommended commands:

```bash
node -v
npm install
npx hardhat vars set MNEMONIC
npx hardhat vars set INFURA_API_KEY
npx hardhat test
```

Do not rely on the template's fallback mnemonic or dummy Infura key for real deployments.

## Dependency baseline

For current FHEVM work, prefer these packages:

- `@fhevm/hardhat-plugin` for Hardhat encryption and decryption APIs
- `@fhevm/solidity` for the Solidity library and config contracts
- `@zama-fhe/relayer-sdk` for frontend-side encryption and decryption flows
- `ethers` for contract interaction
- `@openzeppelin/contracts` and `@openzeppelin/confidential-contracts` when the task uses standard ownership or ERC-7984 primitives

## Contract setup rule

Always inherit `ZamaEthereumConfig` instead of hardcoding infrastructure addresses.

```solidity
pragma solidity ^0.8.24;

import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

contract MyContract is ZamaEthereumConfig {
    constructor() {}
}
```

That constructor wiring is the supported way to attach your contract to the correct coprocessor, ACL, KMS verifier, and input verifier contracts.

## Development checklist

Before writing application logic:

- confirm the project starts from the current template
- confirm the code uses `FHE`, not `TFHE`
- confirm all fresh encrypted inputs are modeled as `externalE...` types plus `bytes inputProof`
- confirm the frontend plan uses `@zama-fhe/relayer-sdk`
- confirm tests will run locally in mock mode before Sepolia validation

## Privacy model reminder

Zama FHEVM protects the plaintext carried by ciphertext handles. It does not automatically hide:

- sender or receiver addresses
- transaction ordering
- which functions were called
- gas usage or event emission patterns

When describing a design, be explicit about what is private and what remains public.