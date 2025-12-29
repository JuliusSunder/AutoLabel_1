# AutoLabel Rebuild and Copy Script
# Baut die App neu und kopiert die Installer-Datei

$ErrorActionPreference = "Stop"

Write-Host "=== AutoLabel Rebuild & Copy ===" -ForegroundColor Cyan
Write-Host ""

# Stelle sicher, dass wir im app-Verzeichnis sind
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptPath

# 1. Clean
Write-Host "[1/3] Clean Build Cache..." -ForegroundColor Yellow
try {
    npm run clean
    if ($LASTEXITCODE -ne 0) {
        throw "Clean fehlgeschlagen"
    }
} catch {
    Write-Host "❌ Clean fehlgeschlagen: $_" -ForegroundColor Red
    exit 1
}

# 2. Build
Write-Host "[2/3] Building AutoLabel..." -ForegroundColor Yellow
Write-Host "Dies kann einige Minuten dauern..." -ForegroundColor Gray
try {
    npm run make
    if ($LASTEXITCODE -ne 0) {
        throw "Build fehlgeschlagen"
    }
} catch {
    Write-Host "❌ Build fehlgeschlagen: $_" -ForegroundColor Red
    exit 1
}

# 3. Copy to website
Write-Host "[3/3] Kopiere Installer..." -ForegroundColor Yellow
$sourceFile = Join-Path $scriptPath "out\make\squirrel.windows\x64\AutoLabel-Setup.exe"
$targetDir = Join-Path $scriptPath "..\website\public\downloads"
$targetFile = Join-Path $targetDir "AutoLabel-Setup.exe"

if (-not (Test-Path $sourceFile)) {
    Write-Host "❌ Installer nicht gefunden: $sourceFile" -ForegroundColor Red
    Write-Host "Bitte pruefe ob der Build erfolgreich war." -ForegroundColor Yellow
    # Versuche alternativen Pfad
    $altSourceFile = Join-Path $scriptPath "out\make\squirrel.windows\x64\AutoLabel-1.0.0 Setup.exe"
    if (Test-Path $altSourceFile) {
        Write-Host "Alternative Datei gefunden: $altSourceFile" -ForegroundColor Yellow
        $sourceFile = $altSourceFile
    } else {
        exit 1
    }
}

# Erstelle Zielverzeichnis falls nicht vorhanden
if (-not (Test-Path $targetDir)) {
    New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
}

# Kopiere Datei
try {
    Copy-Item -Path $sourceFile -Destination $targetFile -Force
    $fileSize = [math]::Round((Get-Item $targetFile).Length / 1MB, 2)
    Write-Host "✅ Installer kopiert: $targetFile ($fileSize MB)" -ForegroundColor Green
} catch {
    Write-Host "❌ Kopieren fehlgeschlagen: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=== Fertig! ===" -ForegroundColor Green
Write-Host "Die Installer-Datei wurde nach website/public/downloads/ kopiert." -ForegroundColor Gray

