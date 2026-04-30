# Zama FHEVM Confidential Contracts Skill

This package is a universal skill package for building confidential smart contracts on Zama Protocol. It keeps the canonical workflow in `SKILL.md`, ships adapters for Codex and Cursor, and stays publishable as a standard Agent Skills directory.

It is intentionally a distribution repo, not a maintainer framework. The package focuses on portable routing, focused references, and reusable templates rather than CI, contribution scaffolding, or benchmark claims.

## What this package covers

- FHEVM architecture and onchain FHE workflow
- Hardhat template setup and project bootstrap
- encrypted Solidity types, operations, ACL, and input proofs
- user decryption and public decryption
- frontend integration with `@zama-fhe/relayer-sdk`
- Hardhat testing and deployment flow
- OpenZeppelin confidential contracts and ERC-7984 patterns
- common anti-patterns and troubleshooting checks

## Installation

Copy the `zama-fhevm-confidential-contracts` directory into one of these locations:

- project-scoped: `.github/skills/zama-fhevm-confidential-contracts`
- user-scoped: `~/.copilot/skills/zama-fhevm-confidential-contracts`
- Codex repo skill: `.agents/skills/zama-fhevm-confidential-contracts`

Keep the directory name unchanged. The Agent Skills spec requires the directory name to match the `name` field in `SKILL.md`.

## Quick start

1. Install the skill into a GitHub Copilot, Codex, or Cursor-compatible location.
2. Open a fresh project based on the Zama Hardhat template.
3. Ask for a confidential contract such as an encrypted counter, voting flow, or ERC-7984 token.
4. Let the skill route into `references/` and `assets/`, then run the generated tests in the target project.

For best results, keep three rules in mind:

- fresh confidential inputs should use `externalE...` plus `inputProof`
- every encrypted state mutation creates a new handle that must be re-allowed
- plaintext amounts, flags, timestamps, and counters should stay plaintext unless the privacy model truly requires encryption

## Adapter matrix

| Adapter | Best use | What it carries |
| --- | --- | --- |
| `SKILL.md` | GitHub Copilot and Agent Skills style loaders | Full routing layer, activation cues, reference map, and correctness checks |
| `AGENTS.md` | Codex or repo-level plain-markdown guidance | Short project instructions that point agents back to `SKILL.md` and the local references |
| `.cursor/rules/zama-fhevm-confidential-contracts.mdc` | Cursor rule import or project rule | Lightweight activation and defaults for Cursor with a pointer back to the full workflow |
| `agents/openai.yaml` | Codex app metadata | Optional metadata for Codex-oriented distribution |

### Cursor

Use one of these two adapters in a target repository:

- copy `.cursor/rules/zama-fhevm-confidential-contracts.mdc` into the target repo's `.cursor/rules/`
- or copy `AGENTS.md` into the target repo root for a simpler plain-markdown setup

Cursor can also remote-import the `.mdc` rule from a GitHub repository.

### Codex

Use one or both of these:

- install the skill folder under `.agents/skills/zama-fhevm-confidential-contracts`
- copy `AGENTS.md` into the repository root to reinforce project-level guidance

Optional Codex app metadata is in `agents/openai.yaml`.

### skills.sh

To publish this package through a GitHub repository, make this directory the repository root or place it as one skill folder in a multi-skill repository. Consumers can then install it with:

```bash
npx skills add malawadd/zama-fhevm-confidential-contracts
```

## Package layout

- `SKILL.md`: routing layer and default rules for the agent
- `AGENTS.md`: plain-markdown adapter for Codex and Cursor
- `.cursor/rules/`: Cursor rule adapter
- `agents/openai.yaml`: Codex app metadata
- `references/`: focused technical references
- `assets/`: starter templates and code examples
- `scripts/validate-skill.mjs`: cross-platform structural validator
- `scripts/validate-skill.sh`: POSIX wrapper
- `scripts/validate-skill.ps1`: PowerShell wrapper

## Validation included

Run the bundled structural validator after edits:

```bash
node scripts/validate-skill.mjs
./scripts/validate-skill.sh
```

```powershell
powershell -ExecutionPolicy Bypass -File scripts/validate-skill.ps1
```

Then run the agent evaluation prompts in `references/validation.md` inside a fresh FHEVM Hardhat template project.

## Validation status

- bundled structural validation passed in this workspace through the packaged validator
- external spec-tool validation with `skills-ref` was not run in this environment
- agent-driven validation still needs to be run from the prompts in `references/validation.md` against a fresh FHEVM Hardhat template project

## Portability notes

This package now ships first-class adapters for Agent Skills loaders, Codex, and Cursor. Use `references/distribution.md` for distribution guidance, installation paths, and cross-platform validation commands.

## Version assumptions

- Zama docs checked on 2026-04-30
- current app-side guidance uses `@zama-fhe/relayer-sdk`
- current Solidity guidance uses `FHE`, `externalE...` inputs, and `ZamaEthereumConfig`
- OpenZeppelin confidential contracts are useful but evolve quickly and do not promise backward compatibility
- validation still depends on the target machine meeting Zama's Node and Hardhat prerequisites