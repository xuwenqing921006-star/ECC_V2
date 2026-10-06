@echo off
setlocal
set "ECC_V2_ROOT=%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js 20 or later is required.
  pause
  exit /b 1
)
if "%~1"=="" (
  node "%ECC_V2_ROOT%scripts\\ecc-v2.js" dashboard
) else (
  node "%ECC_V2_ROOT%scripts\\ecc-v2.js" %*
)
