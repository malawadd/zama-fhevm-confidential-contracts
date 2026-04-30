# Distribution and tool adapters

This repository is intentionally a distribution package. It is meant to be installed and reused across agent tools, not to act as a maintainer framework with CI, contributor policy, or benchmark reporting.

## Agent Skills and skills.sh

This package follows the open Agent Skills directory layout:

- `SKILL.md`
- `references/`
- `assets/`
- `scripts/`
- optional tool metadata such as `agents/openai.yaml`

That makes it suitable for:

- GitHub Copilot style skill loaders
- Codex Agent Skills
- skills.sh GitHub-based distribution

The current package intentionally does not bundle:

- maintainer-only CI workflows
- contribution scaffolding or a skill template generator
- benchmark claims or evaluation dashboards

For skills.sh style installation, publish this package from a GitHub repository and install it with:

```bash
npx skills add malawadd/zama-fhevm-confidential-contracts
```

If the repository hosts multiple skills, keep each skill in its own folder with its own `SKILL.md`. If the repository hosts only this skill, use this package directory as the repository root.

## Codex

Codex supports both `SKILL.md`-based agent skills and repository-level `AGENTS.md` instructions.

Recommended usage:

- for reusable skill installation: copy this folder into `.agents/skills/zama-fhevm-confidential-contracts`
- for repository-level reinforcement: place `AGENTS.md` at the target repository root
- for Codex app metadata: include `agents/openai.yaml`

Codex can also distribute reusable skills as plugins, but the skill folder itself is the primary authoring format.

## Cursor

Cursor supports two relevant formats:

- `AGENTS.md` at the project root for simple plain-markdown instructions
- `.cursor/rules/*.mdc` for a rule with metadata-driven activation

This package ships both adapters:

- `AGENTS.md`
- `.cursor/rules/zama-fhevm-confidential-contracts.mdc`

For direct project use, copy one of them into the project root. For remote import, publish the repository and import the `.mdc` rule from GitHub through Cursor's Remote Rule flow.

## Adapter expectations

Use the adapter that matches the tool and the depth you need:

- `SKILL.md` for the full routing layer, reference map, and correctness checks
- `AGENTS.md` when the tool only consumes repository-level markdown instructions
- `.cursor/rules/zama-fhevm-confidential-contracts.mdc` for Cursor-native rule activation
- `agents/openai.yaml` as optional metadata for Codex-oriented distribution

## Cross-platform notes

The packaged validation path is Node-based so it works on Windows, macOS, and Linux. Use one of these commands from the skill root:

```bash
node scripts/validate-skill.mjs
./scripts/validate-skill.sh
```

```powershell
powershell -ExecutionPolicy Bypass -File scripts/validate-skill.ps1
```

Because Zama's documented Hardhat workflow assumes Node and npm, these are reasonable baseline requirements across all operating systems.

Structural validation only proves the package layout and local guidance consistency. Contract correctness still has to be exercised in a target Hardhat project with the prompts from `references/validation.md`.

## Publishing checklist

Before publishing:

- keep `SKILL.md` at the root of the published skill directory
- keep the directory name equal to the `name` field in `SKILL.md`
- run the local validator
- keep the main skill concise and push detail into `references/` and `assets/`
- verify the repo contains the Cursor and Codex adapters if you want cross-tool claims
- include the demo and validation evidence if the package is being submitted to a judged program