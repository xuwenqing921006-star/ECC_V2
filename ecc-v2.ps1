param(
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$Arguments
)

$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$Node = Get-Command node -ErrorAction SilentlyContinue

if (-not $Node) {
    Write-Error 'Node.js 20 or later is required. Install Node.js, reopen PowerShell, and try again.'
}

& $Node.Source (Join-Path $Root 'scripts\\ecc-v2.js') @Arguments
exit $LASTEXITCODE
