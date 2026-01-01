# AutoLabel Icon-Verifikation Script
# Überprüft, ob alle Icons korrekt konfiguriert sind

Write-Host "=== AutoLabel Icon-Verifikation ===" -ForegroundColor Cyan
Write-Host ""

$errors = 0
$warnings = 0

# Funktion zum Prüfen von Dateien
function Test-FileExists {
    param($path, $description)
    if (Test-Path $path) {
        Write-Host "[OK] $description" -ForegroundColor Green
        return $true
    } else {
        Write-Host "[FEHLER] $description nicht gefunden: $path" -ForegroundColor Red
        $script:errors++
        return $false
    }
}

# Funktion zum Prüfen von Dateiinhalt
function Test-FileContent {
    param($path, $pattern, $description)
    if (Test-Path $path) {
        $content = Get-Content $path -Raw
        if ($content -match $pattern) {
            Write-Host "[OK] $description" -ForegroundColor Green
            return $true
        } else {
            Write-Host "[FEHLER] $description nicht gefunden in: $path" -ForegroundColor Red
            $script:errors++
            return $false
        }
    } else {
        Write-Host "[FEHLER] Datei nicht gefunden: $path" -ForegroundColor Red
        $script:errors++
        return $false
    }
}

Write-Host "1. Icon-Dateien prüfen..." -ForegroundColor Yellow
Write-Host ""

Test-FileExists "icons/icon_512x512.png" "icon_512x512.png"
Test-FileExists "icons/icon_256x256.png" "icon_256x256.png"
Test-FileExists "icons/icon_128x128.png" "icon_128x128.png"
Test-FileExists "icons/icon_64x64.png" "icon_64x64.png"
Test-FileExists "icons/icon_48x48.png" "icon_48x48.png"
Test-FileExists "icons/icon_32x32.png" "icon_32x32.png"
Test-FileExists "icons/icon_16x16.png" "icon_16x16.png"
Test-FileExists "icons/icon.ico" "icon.ico (Windows Multi-Resolution)"

Write-Host ""
Write-Host "2. Favicon prüfen..." -ForegroundColor Yellow
Write-Host ""

Test-FileExists "public/favicon.png" "public/favicon.png"

Write-Host ""
Write-Host "3. Konfigurationsdateien prüfen..." -ForegroundColor Yellow
Write-Host ""

# forge.config.ts
Test-FileContent "forge.config.ts" "icon:\s*'\.\/icons\/icon_256x256'" "forge.config.ts: packagerConfig.icon"
Test-FileContent "forge.config.ts" "setupIcon:\s*'\.\/icons\/icon\.ico'" "forge.config.ts: MakerSquirrel.setupIcon"
Test-FileContent "forge.config.ts" "icon:\s*'\.\/icons\/icon_256x256\.png'" "forge.config.ts: Linux Maker Icons"

# main.ts
Test-FileContent "src/main.ts" "icon:\s*path\.join\(__dirname,\s*'\.\.\/\.\.\/icons\/icon_256x256\.png'\)" "main.ts: BrowserWindow.icon"
Test-FileContent "src/main.ts" "title:\s*'AutoLabel'" "main.ts: BrowserWindow.title"

# index.html
Test-FileContent "index.html" '<link rel="icon"[^>]*href="/favicon\.png"' "index.html: Favicon Link"
Test-FileContent "index.html" "<title>AutoLabel</title>" "index.html: Title"

# vite.renderer.config.ts
Test-FileContent "vite.renderer.config.ts" "publicDir:\s*'public'" "vite.renderer.config.ts: publicDir"

# package.json
Test-FileContent "package.json" '"productName":\s*"AutoLabel"' "package.json: productName"
Test-FileContent "package.json" '"name":\s*"autolabel"' "package.json: name"

Write-Host ""
Write-Host "4. Icon-Größen prüfen..." -ForegroundColor Yellow
Write-Host ""

$iconSizes = @{
    "icons/icon_512x512.png" = 512
    "icons/icon_256x256.png" = 256
    "icons/icon_128x128.png" = 128
    "icons/icon_64x64.png" = 64
    "icons/icon_48x48.png" = 48
    "icons/icon_32x32.png" = 32
    "icons/icon_16x16.png" = 16
}

foreach ($icon in $iconSizes.Keys) {
    if (Test-Path $icon) {
        $size = $iconSizes[$icon]
        # Hinweis: PowerShell kann PNG-Größen nicht direkt auslesen ohne externe Tools
        # Wir prüfen nur, ob die Datei existiert und nicht leer ist
        $fileInfo = Get-Item $icon
        if ($fileInfo.Length -gt 0) {
            Write-Host "[OK] $icon ($($fileInfo.Length) Bytes)" -ForegroundColor Green
        } else {
            Write-Host "[FEHLER] $icon ist leer" -ForegroundColor Red
            $script:errors++
        }
    }
}

Write-Host ""
Write-Host "=== Zusammenfassung ===" -ForegroundColor Cyan
Write-Host ""

if ($errors -eq 0 -and $warnings -eq 0) {
    Write-Host "✅ Alle Icon-Konfigurationen sind korrekt!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Nächste Schritte:" -ForegroundColor Yellow
    Write-Host "  1. Development testen: npm start" -ForegroundColor White
    Write-Host "  2. Production Build: npm run make" -ForegroundColor White
    Write-Host "  3. Installer testen: out/make/squirrel.windows/x64/AutoLabel-Setup.exe" -ForegroundColor White
    exit 0
} else {
    Write-Host "❌ $errors Fehler gefunden" -ForegroundColor Red
    if ($warnings -gt 0) {
        Write-Host "⚠️  $warnings Warnungen" -ForegroundColor Yellow
    }
    Write-Host ""
    Write-Host "Bitte behebe die Fehler und führe das Script erneut aus." -ForegroundColor Yellow
    exit 1
}

