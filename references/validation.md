# Validation

## Structural validation

Run the bundled validator from the skill root:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/validate-skill.ps1
```

This checks:

- the `SKILL.md` frontmatter exists
- the skill directory name matches the frontmatter `name`
- required reference and asset files exist
- referenced local Markdown files resolve correctly
- the main skill stays under the spec's recommended size envelope
- asset templates do not reintroduce deprecated APIs such as `TFHE` or `einput`

Structural validation here does not prove the skill generated a correct contract in a target Hardhat project. It only checks the package shape, local references, and obvious deprecated patterns.

## Current run status

- structural validation executed in this workspace on 2026-04-30: `powershell -ExecutionPolicy Bypass -File scripts/validate-skill.ps1`
- structural validation result: pass
- `skills-ref` was not available in the current environment, so external spec-tool validation was not run here
- agent-in-the-loop validation prompts below are ready for the next step inside GitHub Copilot or another Agent Skills compatible tool

## Agent-in-the-loop evaluation setup

Use a fresh repository created from `zama-ai/fhevm-hardhat-template`. Install this skill into the agent environment, then run both prompts below.

## Prompt 1: confidential voting

```text
Write me a confidential voting contract using Zama FHEVM. I need a Solidity contract, a Hardhat test, and a minimal frontend TypeScript example. Each voter should cast an encrypted yes or no vote once, the contract owner should be able to privately decrypt the tally, and the final tally should optionally be made publicly decryptable after the vote ends.
```

Pass criteria:

- contract uses `FHE`, `ZamaEthereumConfig`, `externalEbool`, and `bytes inputProof`
- tally state is re-allowed with `FHE.allowThis` and owner access is granted with `FHE.allow` after every mutation that creates a new handle
- test uses `fhevm.createEncryptedInput` and `fhevm.userDecryptEuint`
- frontend uses `@zama-fhe/relayer-sdk` with `createEncryptedInput`, `createEIP712`, and `userDecrypt`
- public reveal path uses `FHE.makePubliclyDecryptable`

## Prompt 2: confidential ERC-7984 token

```text
Build a confidential ERC-7984 token using Zama Protocol and OpenZeppelin confidential contracts. Include mint and burn support, explain operator semantics, add a note on how an ERC-20 wrapper or unwrap flow works, and provide a Hardhat test for minting and confidential transfers.
```

Pass criteria:

- response states that ERC-7984 is draft and not ERC-20 compatible
- contract starts from OpenZeppelin `ERC7984` and current Zama imports
- minted amounts use `externalEuint64` plus `inputProof`
- response distinguishes operators from decrypt permissions
- any reassigned encrypted balances or allowances are re-allowed for the contract and the actors that need later access
- wrapper guidance explains the public ERC-20 to confidential ERC-7984 flow and the disclose or finalize step for reverse conversion

## Manual review checklist

Reject or revise the generated output if any of the following appear:

- `TFHE` namespace in new code
- `einput` instead of `externalE...`
- hardcoded coprocessor or verifier addresses
- missing `inputProof` for fresh confidential inputs
- `view` functions described as returning plaintext values
- no ACL setup for handles that later need decryption
- encrypted storage is reassigned without renewed ACL on the new handle
- plaintext flags, loop bounds, or timestamps are encrypted without a clear privacy need
- ERC-7984 described as an ERC-20 drop-in replacement
- callbacks added without any reentrancy discussion