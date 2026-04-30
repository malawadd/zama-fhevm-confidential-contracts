# Zama FHEVM Agent Instructions

Use the local skill package in this repository when the task involves confidential smart contracts on Zama Protocol.

## When to apply this guidance

- FHEVM Solidity development
- confidential voting or encrypted counters
- ERC-7984 or OpenZeppelin confidential token work
- encrypted inputs, input proofs, ACL, user decryption, or public decryption
- Hardhat setup, testing, deployment, or frontend relayer integration for Zama Protocol

## Required defaults

- Read `SKILL.md` first, then pull in only the needed files from `references/` and `assets/`.
- Use `FHE`, not deprecated `TFHE`.
- Use `externalE...` types plus `bytes inputProof` for fresh encrypted inputs.
- Inherit `ZamaEthereumConfig`; do not hardcode FHEVM infrastructure addresses.
- Use `@fhevm/hardhat-plugin` for tests and `@zama-fhe/relayer-sdk` for current frontend flows.
- Re-grant ACL permissions whenever encrypted state is reassigned and a new ciphertext handle is produced for later reuse or decryption.
- Describe the privacy scope honestly: ciphertext values are private, but addresses and transaction metadata are not automatically hidden.

## High-value references

- `references/architecture-and-setup.md`
- `references/solidity-patterns.md`
- `references/frontend-and-decryption.md`
- `references/testing-and-deployment.md`
- `references/oz-and-erc7984.md`
- `references/troubleshooting.md`
- `references/validation.md`

## Output expectations

For new features, produce the contract, test, deployment path, and any minimal frontend or script needed to exercise confidential behavior. Before returning code, check for deprecated APIs, missing ACL, missing input proofs, plaintext assumptions in view functions, and ERC-7984 operator confusion.