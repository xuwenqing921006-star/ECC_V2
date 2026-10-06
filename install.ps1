param(
    [ValidateSet('zh-CN', 'en-US')]
    [string]$Locale = 'zh-CN'
)

$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$Node = Get-Command node -ErrorAction SilentlyContinue

if (-not $Node) {
    throw 'Node.js 20 or later is required.'
}

$VersionText = & $Node.Source --version
$Major = [int](($VersionText -replace '^v', '').Split('.')[0])
if ($Major -lt 20) {
    throw "Node.js 20 or later is required. Found $VersionText."
}

$MemoryRoot = Join-Path $env:USERPROFILE '.ecc-v2\\memory'
New-Item -ItemType Directory -Path $MemoryRoot -Force | Out-Null

Write-Output "ECC V2 is ready."
Write-Output "Root: $Root"
Write-Output "Locale: $Locale"
Write-Output "System memory: $MemoryRoot"
Write-Output ''
Write-Output 'Next:'
Write-Output '  .\\ECC_V2.cmd doctor'
Write-Output '  .\\ECC_V2.cmd init my-project --name "My Project"'
Write-Output '  .\\ECC_V2.cmd dashboard'
