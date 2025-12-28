# AutoLabel Release Build Script (PowerShell)
# Builds production-ready installer with proper branding

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  AutoLabel Release Build" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[1/4] Cleaning build cache..." -ForegroundColor Yellow
npm run clean
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Clean failed" -ForegroundColor Red
    exit $LASTEXITCODE
}

Write-Host ""
Write-Host "[2/4] Verifying icons..." -ForegroundColor Yellow
if (-not (Test-Path "icons\icon_256x256.png")) {
    Write-Host "WARNING: Icons not found. Generating..." -ForegroundColor Yellow
    node build-icons.js
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Icon generation failed" -ForegroundColor Red
        exit $LASTEXITCODE
    }
}
Write-Host "Icons OK" -ForegroundColor Green

Write-Host ""
Write-Host "[3/4] Building production package..." -ForegroundColor Yellow
npm run make
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Build failed" -ForegroundColor Red
    exit $LASTEXITCODE
}

Write-Host ""
Write-Host "[4/4] Build complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Output location:" -ForegroundColor Cyan
Write-Host "  Windows: out\make\squirrel.windows\x64\" -ForegroundColor White
Write-Host "  Installer: AutoLabel-1.0.0 Setup.exe" -ForegroundColor White
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Build successful!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

