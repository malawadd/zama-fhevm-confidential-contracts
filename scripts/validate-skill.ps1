param(
    [string]$SkillRoot = (Split-Path -Parent $PSScriptRoot)
)

$validator = Join-Path $PSScriptRoot "validate-skill.mjs"
node $validator $SkillRoot
if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
}