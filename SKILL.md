---
name: zama-fhevm-confidential-contracts
description: Build, test, deploy, and integrate confidential smart contracts on Zama Protocol FHEVM. Use when the user asks for FHEVM Solidity, encrypted voting, confidential ERC-7984 tokens, OpenZeppelin confidential contracts, Hardhat setup, encrypted inputs, ACL, decryption, or frontend relayer integration.
compatibility: Designed for Agent Skills compatible tools and adapters for GitHub Copilot, Codex, Cursor, and skills.sh style GitHub distribution, with filesystem access and optional internet access for current Zama docs.
metadata:
  author: Mohammed Alawad
  version: "1.0.0"
  protocol_baseline: "Zama docs checked 2026-04-30"
  package_scope: "universal"
  keywords:
    - fhevm
    - zama
    - solidity
    - confidential-smart-contracts
    - hardhat
  category: blockchain
---

# Zama FHEVM Confidential Contracts

Use this skill whenever the task involves writing, fixing, testing, deploying, or integrating smart contracts that compute on encrypted values with Zama Protocol.

## Activation cues

Activate this skill if the user mentions any of the following:
- FHEVM, Zama Protocol, confidential smart contracts
- encrypted Solidity types such as `euint64`, `ebool`, or `eaddress`
- `FHE.add`, `FHE.sub`, `FHE.select`, `FHE.allow`, `FHE.allowTransient`, or `FHE.makePubliclyDecryptable`
- encrypted inputs, input proofs, user decryption, public decryption, or EIP-712 decryption signatures
- `@fhevm/hardhat-plugin`, `@zama-fhe/relayer-sdk`, or older `fhevmjs`
- OpenZeppelin confidential contracts or ERC-7984
- confidential voting, confidential ERC-20 style tokens, wrappers, or private transfer flows
- mixed plaintext and encrypted state such as encrypted balances with public membership flags, counters, or timestamps

## Non-negotiable defaults

1. Treat the current protocol baseline as Zama documentation current on 2026-04-30.
2. Use `FHE`, not legacy `TFHE`.
3. Use `externalE...` input types plus `bytes inputProof` for fresh encrypted user inputs.
4. Inherit `ZamaEthereumConfig` instead of hardcoding coprocessor, ACL, KMS, or input verifier addresses.
5. Use `@fhevm/hardhat-plugin` for Hardhat tests and `@zama-fhe/relayer-sdk` for current frontend encryption and decryption flows.
6. Assume encrypted `view` functions return ciphertext handles, not plaintext values.
7. Re-grant ACL permissions after producing new ciphertext state. Every storage reassignment that returns a new handle after `FHE.add`, `FHE.sub`, `FHE.select`, or similar operations must be followed by the right `FHE.allowThis`, `FHE.allow`, or `FHE.allowTransient` calls. Missing ACL on the new handle is a correctness bug, not an optimization issue.
8. Prefer the official Hardhat template as the starting point for new work.
9. When a user asks for ERC-7984, state that it is a draft ERC and is not ERC-20 compatible.
10. Never claim participant addresses are private onchain unless the surrounding design truly hides them elsewhere.

## Default workflow

1. Start from the official Hardhat template and current dependency set. Use [architecture and setup](references/architecture-and-setup.md).
2. Choose the right contract pattern before writing code.
   - General FHEVM contract: [Solidity patterns](references/solidity-patterns.md)
   - Frontend or wallet flow: [frontend and decryption](references/frontend-and-decryption.md)
   - Tests or deployment: [testing and deployment](references/testing-and-deployment.md)
   - Confidential token or wrapper: [OpenZeppelin and ERC-7984](references/oz-and-erc7984.md)
   - Failure analysis: [troubleshooting](references/troubleshooting.md)
3. Draft the contract with current imports, encrypted inputs, and ACL rules.
  - Identify every code path that replaces encrypted storage and treat each replacement as a new handle that must be re-allowed.
  - Keep plaintext membership flags, roles, timestamps, and loop bounds plaintext unless confidentiality is actually required for them.
4. Generate a matching Hardhat test that encrypts inputs, passes `inputProof`, and decrypts expected handles.
5. Add deployment or integration code only after the contract and tests agree on the ciphertext lifecycle.
6. Self-check against the validation checklist before presenting the result. Use [validation](references/validation.md).

## Architecture rules

- The EVM stores ciphertext handles and calls Zama's FHEVM infrastructure for encrypted computation.
- Fresh encrypted user inputs are created offchain, uploaded through the relayer, and imported onchain with `FHE.fromExternal`.
- The ACL governs who can reuse or decrypt ciphertexts.
- User decryption is an offchain re-encryption flow authorized by an EIP-712 signature.
- Public decryption is opt-in and must be explicitly enabled with `FHE.makePubliclyDecryptable`.

## Output requirements by task

### New contract request

Produce:
- the Solidity contract
- a Hardhat test file
- any deployment or task file needed to use it
- a minimal frontend or script example when the request involves user interaction or decryption
- a short note on privacy scope and version assumptions

### Debug or review request

Check for:
- deprecated `TFHE`, `einput`, or old oracle-request APIs
- missing `ZamaEthereumConfig`
- missing `FHE.allowThis`, `FHE.allow`, or `FHE.allowTransient`, especially after encrypted state is reassigned
- missing or mismatched `inputProof`
- plaintext assumptions in `view` functions
- ciphertext-heavy loops that should instead use plaintext counters, flags, or bounded batching
- incorrect ERC-7984 operator or callback semantics

### ERC-7984 or OpenZeppelin request

Prefer the OpenZeppelin confidential contracts library when the user wants a standard token primitive or wrapper. Use [OpenZeppelin and ERC-7984](references/oz-and-erc7984.md) and [confidential token pattern](assets/confidential-token-pattern.sol.md).

## Canonical templates

Use these before inventing a new pattern:
- [confidential voting Solidity template](assets/confidential-voting.sol.md)
- [confidential voting Hardhat test template](assets/confidential-voting.test.ts.md)
- [confidential token Solidity template](assets/confidential-token-pattern.sol.md)
- [frontend relayer integration template](assets/fhevm-frontend.ts.md)

## Required correctness checks

Before returning code:
1. Confirm every fresh encrypted parameter uses an `externalE...` type plus `bytes inputProof`.
2. Confirm every newly produced encrypted state value is re-allowed for the contract and any actor that must decrypt or reuse it later.
3. Confirm any plaintext scalar input path is intentional and still enforced with FHE comparisons or selection logic when confidentiality depends on encrypted state.
4. Confirm tests use the Hardhat `fhevm` API for encryption and decryption.
5. Confirm the code does not hardcode Zama infrastructure addresses.
6. Confirm decryption batches stay under the 2048-bit limit.
7. Confirm public reveal flows use `FHE.makePubliclyDecryptable` and, when verified onchain, `FHE.checkSignatures`.
8. Confirm ERC-7984 callbacks are guarded against reentrancy if callback variants are used.

## When docs conflict

Prefer this priority order:
1. Current Zama Protocol docs
2. Current `@fhevm/hardhat-plugin` and `@zama-fhe/relayer-sdk` docs
3. Current OpenZeppelin confidential contracts docs
4. ERC-7984 draft specification
5. Older `fhevmjs` examples only as migration clues, not as the default implementation path

## Version guardrails

- `FHE` replaced the older `TFHE` namespace.
- `externalEuint...`, `externalEbool`, and `externalEaddress` replaced older `einput` patterns.
- Relayer-based decryption is the current flow. Do not default to deprecated gateway-request APIs.
- OpenZeppelin confidential contracts move quickly and explicitly warn that backward compatibility is not guaranteed.
- Use `@zama-fhe/relayer-sdk` for current app code even if older examples mention `fhevmjs`.

## Reference map

- [architecture and setup](references/architecture-and-setup.md)
- [Solidity patterns](references/solidity-patterns.md)
- [frontend and decryption](references/frontend-and-decryption.md)
- [testing and deployment](references/testing-and-deployment.md)
- [OpenZeppelin and ERC-7984](references/oz-and-erc7984.md)
- [troubleshooting](references/troubleshooting.md)
- [validation](references/validation.md)
- [distribution](references/distribution.md)