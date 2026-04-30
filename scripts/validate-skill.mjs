import fs from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import process from "node:process";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const skillRoot = process.argv[2] ? path.resolve(process.argv[2]) : path.resolve(scriptDir, "..");
const errors = [];
const isGitCheckout = fs.existsSync(path.join(skillRoot, ".git"));

function addError(message) {
  errors.push(message);
}

function readText(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

const skillFile = path.join(skillRoot, "SKILL.md");
if (!fs.existsSync(skillFile)) {
  addError("Missing SKILL.md");
}

if (!fs.existsSync(skillFile)) {
  for (const error of errors) {
    console.error(error);
  }
  process.exit(1);
}

const skillText = readText(skillFile);
const skillLines = skillText.split(/\r?\n/);

if (skillLines.length > 500) {
  addError("SKILL.md should stay under 500 lines for progressive loading");
}

if (skillLines[0] !== "---") {
  addError("SKILL.md is missing YAML frontmatter");
}

const frontmatterEnd = skillLines.indexOf("---", 1);
if (frontmatterEnd < 1) {
  addError("SKILL.md frontmatter is not closed");
}

const nameMatch = skillText.match(/^name:\s*([a-z0-9-]+)$/m);
if (!nameMatch) {
  addError("SKILL.md frontmatter is missing a valid name field");
} else {
  const directoryName = path.basename(skillRoot);
  if (nameMatch[1] !== directoryName) {
    if (isGitCheckout) {
      console.warn(
        `Warning: SKILL.md name '${nameMatch[1]}' does not match checkout directory '${directoryName}'. Installed skill directories should use the skill name.`
      );
    } else {
      addError(`SKILL.md name '${nameMatch[1]}' must match directory '${directoryName}'`);
    }
  }
}

const requiredFiles = [
  "README.md",
  "AGENTS.md",
  "package.json",
  "agents/openai.yaml",
  ".cursor/rules/zama-fhevm-confidential-contracts.mdc",
  "references/architecture-and-setup.md",
  "references/solidity-patterns.md",
  "references/frontend-and-decryption.md",
  "references/testing-and-deployment.md",
  "references/oz-and-erc7984.md",
  "references/troubleshooting.md",
  "references/validation.md",
  "references/distribution.md",
  "assets/confidential-voting.sol.md",
  "assets/confidential-voting.test.ts.md",
  "assets/confidential-token-pattern.sol.md",
  "assets/fhevm-frontend.ts.md"
];

for (const relativePath of requiredFiles) {
  const fullPath = path.join(skillRoot, relativePath);
  if (!fs.existsSync(fullPath)) {
    addError(`Missing required file: ${relativePath}`);
  }
}

function walkMarkdownFiles(rootDir) {
  const stack = [rootDir];
  const files = [];
  const ignoredDirectories = new Set([".git", ".next", "dist", "node_modules"]);
  while (stack.length > 0) {
    const current = stack.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        if (ignoredDirectories.has(entry.name)) {
          continue;
        }
        stack.push(fullPath);
      } else if (entry.isFile() && entry.name.endsWith(".md")) {
        files.push(fullPath);
      }
    }
  }
  return files;
}

for (const filePath of walkMarkdownFiles(skillRoot)) {
  const content = readText(filePath);
  const markdownLinks = [...content.matchAll(/\(([^)]+)\)/g)];
  for (const match of markdownLinks) {
    const target = match[1];
    if (/^(https?:|mailto:|#)/.test(target)) {
      continue;
    }
    if (!target.endsWith(".md")) {
      continue;
    }
    const resolved = path.join(skillRoot, target);
    if (!fs.existsSync(resolved)) {
      addError(`Broken local Markdown reference '${target}' in ${path.relative(skillRoot, filePath)}`);
    }
  }
}

const deprecatedPatterns = [
  /TFHE\./,
  /\beinput\b/,
  /requestDecryption\(/,
  /setDecryptionOracle\(/
];

for (const relativeDir of ["assets"]) {
  const dirPath = path.join(skillRoot, relativeDir);
  if (!fs.existsSync(dirPath)) {
    continue;
  }
  for (const filePath of walkMarkdownFiles(dirPath)) {
    const content = readText(filePath);
    for (const pattern of deprecatedPatterns) {
      if (pattern.test(content)) {
        addError(`Deprecated API pattern '${pattern}' found in ${path.relative(skillRoot, filePath)}`);
      }
    }
  }
}

if (errors.length > 0) {
  for (const error of errors) {
    console.error(error);
  }
  process.exit(1);
}

console.log("Skill validation passed.");