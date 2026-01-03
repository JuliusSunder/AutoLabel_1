# AutoLabel - SumatraPDF Diagnose Script
# Dieses Script prüft, ob SumatraPDF im installierten AutoLabel gefunden werden kann

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "AutoLabel - SumatraPDF Diagnose" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Finde AutoLabel Installation
Write-Host "1. Suche AutoLabel Installation..." -ForegroundColor Yellow
$autoLabelPath = "$env:LOCALAPPDATA\autolabel"

if (Test-Path $autoLabelPath) {
    Write-Host "   ✓ AutoLabel gefunden: $autoLabelPath" -ForegroundColor Green
    
    # Finde die neueste Version
    $appDirs = Get-ChildItem -Path $autoLabelPath -Directory | Where-Object { $_.Name -like "app-*" } | Sort-Object Name -Descending
    
    if ($appDirs.Count -gt 0) {
        $latestApp = $appDirs[0]
        Write-Host "   ✓ Neueste Version: $($latestApp.Name)" -ForegroundColor Green
        
        # 2. Prüfe resources Ordner
        Write-Host ""
        Write-Host "2. Prüfe resources Ordner..." -ForegroundColor Yellow
        $resourcesPath = Join-Path $latestApp.FullName "resources"
        
        if (Test-Path $resourcesPath) {
            Write-Host "   ✓ Resources gefunden: $resourcesPath" -ForegroundColor Green
            
            # 3. Prüfe SumatraPDF
            Write-Host ""
            Write-Host "3. Prüfe SumatraPDF..." -ForegroundColor Yellow
            
            $sumatraPaths = @(
                (Join-Path $resourcesPath "bin\SumatraPDF\SumatraPDF.exe"),
                (Join-Path $resourcesPath "bin\SumatraPDF.exe")
            )
            
            $found = $false
            foreach ($path in $sumatraPaths) {
                Write-Host "   Prüfe: $path" -ForegroundColor Gray
                if (Test-Path $path) {
                    Write-Host "   ✓ SumatraPDF gefunden!" -ForegroundColor Green
                    Write-Host "   Pfad: $path" -ForegroundColor Green
                    
                    # Prüfe Dateigröße
                    $file = Get-Item $path
                    Write-Host "   Größe: $([math]::Round($file.Length / 1MB, 2)) MB" -ForegroundColor Green
                    Write-Host "   Erstellt: $($file.CreationTime)" -ForegroundColor Green
                    
                    # Teste ob ausführbar
                    Write-Host ""
                    Write-Host "   Teste Ausführbarkeit..." -ForegroundColor Yellow
                    try {
                        $output = & $path -? 2>&1
                        Write-Host "   ✓ SumatraPDF ist ausführbar!" -ForegroundColor Green
                    } catch {
                        Write-Host "   ✗ Fehler beim Ausführen: $($_.Exception.Message)" -ForegroundColor Red
                    }
                    
                    $found = $true
                    break
                } else {
                    Write-Host "   ✗ Nicht gefunden" -ForegroundColor Red
                }
            }
            
            if (-not $found) {
                Write-Host ""
                Write-Host "   ✗✗✗ SumatraPDF NICHT GEFUNDEN! ✗✗✗" -ForegroundColor Red
                Write-Host "   Dies ist die Ursache für leere Druckseiten!" -ForegroundColor Red
                Write-Host ""
                Write-Host "   Lösung:" -ForegroundColor Yellow
                Write-Host "   1. AutoLabel neu installieren" -ForegroundColor Yellow
                Write-Host "   2. Sicherstellen dass app/bin/SumatraPDF/ vor dem Build existiert" -ForegroundColor Yellow
                
                # Liste alle Dateien im bin Ordner
                Write-Host ""
                Write-Host "   Vorhandene Dateien in resources/bin/:" -ForegroundColor Yellow
                $binPath = Join-Path $resourcesPath "bin"
                if (Test-Path $binPath) {
                    Get-ChildItem -Path $binPath -Recurse -File | Select-Object -First 20 | ForEach-Object {
                        Write-Host "   - $($_.FullName.Replace($binPath, 'bin'))" -ForegroundColor Gray
                    }
                } else {
                    Write-Host "   ✗ bin/ Ordner existiert nicht!" -ForegroundColor Red
                }
            }
            
        } else {
            Write-Host "   ✗ Resources Ordner nicht gefunden!" -ForegroundColor Red
        }
        
    } else {
        Write-Host "   ✗ Keine app-* Ordner gefunden!" -ForegroundColor Red
    }
    
} else {
    Write-Host "   ✗ AutoLabel nicht installiert in: $autoLabelPath" -ForegroundColor Red
    Write-Host ""
    Write-Host "   Alternative Pfade:" -ForegroundColor Yellow
    
    $altPaths = @(
        "$env:APPDATA\AutoLabel",
        "$env:PROGRAMFILES\AutoLabel",
        "${env:PROGRAMFILES(x86)}\AutoLabel"
    )
    
    foreach ($altPath in $altPaths) {
        if (Test-Path $altPath) {
            Write-Host "   ✓ Gefunden: $altPath" -ForegroundColor Green
        } else {
            Write-Host "   ✗ Nicht gefunden: $altPath" -ForegroundColor Gray
        }
    }
}

# 4. Prüfe System-Installation
Write-Host ""
Write-Host "4. Prüfe System-Installation von SumatraPDF..." -ForegroundColor Yellow

$systemPaths = @(
    "C:\Program Files\SumatraPDF\SumatraPDF.exe",
    "C:\Program Files (x86)\SumatraPDF\SumatraPDF.exe"
)

$systemFound = $false
foreach ($path in $systemPaths) {
    if (Test-Path $path) {
        Write-Host "   ✓ System-Installation gefunden: $path" -ForegroundColor Green
        $systemFound = $true
    }
}

if (-not $systemFound) {
    Write-Host "   ℹ Keine System-Installation (das ist OK)" -ForegroundColor Gray
}

# 5. Prüfe PATH
Write-Host ""
Write-Host "5. Prüfe System PATH..." -ForegroundColor Yellow
try {
    $whereResult = where.exe SumatraPDF.exe 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✓ SumatraPDF in PATH gefunden: $whereResult" -ForegroundColor Green
    } else {
        Write-Host "   ℹ Nicht in PATH (das ist OK)" -ForegroundColor Gray
    }
} catch {
    Write-Host "   ℹ Nicht in PATH (das ist OK)" -ForegroundColor Gray
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Diagnose abgeschlossen" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Drücke eine beliebige Taste zum Beenden..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

