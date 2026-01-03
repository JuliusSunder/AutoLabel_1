# AutoLabel Icon Cache Fix Script
# This script helps fix Windows icon display issues by clearing the icon cache

Write-Host "=== AutoLabel Icon Cache Fix ===" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check if icon.ico exists
Write-Host "Step 1: Checking icon.ico file..." -ForegroundColor Yellow
$iconPath = Join-Path $PSScriptRoot "icons\icon.ico"

if (Test-Path $iconPath) {
    Write-Host "✅ icon.ico found at: $iconPath" -ForegroundColor Green
    
    # Get file size
    $iconSize = (Get-Item $iconPath).Length
    Write-Host "   File size: $iconSize bytes" -ForegroundColor Gray
    
    # Check if it's a valid ICO file (should start with 0x00 0x00 0x01 0x00)
    $bytes = [System.IO.File]::ReadAllBytes($iconPath)
    if ($bytes.Length -gt 4 -and $bytes[0] -eq 0x00 -and $bytes[1] -eq 0x00 -and $bytes[2] -eq 0x01 -and $bytes[3] -eq 0x00) {
        Write-Host "✅ Valid ICO file format" -ForegroundColor Green
        
        # Count number of images in ICO (byte 4-5 contains the count)
        $imageCount = [BitConverter]::ToUInt16($bytes, 4)
        Write-Host "   Contains $imageCount image size(s)" -ForegroundColor Gray
    } else {
        Write-Host "⚠️  Warning: File might not be a valid ICO file" -ForegroundColor Yellow
    }
} else {
    Write-Host "❌ icon.ico not found at: $iconPath" -ForegroundColor Red
    Write-Host "   Please make sure the icon file exists before building the app." -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Step 2: Clear Windows Icon Cache
Write-Host "Step 2: Clearing Windows Icon Cache..." -ForegroundColor Yellow
Write-Host "   This requires closing Explorer.exe temporarily." -ForegroundColor Gray
Write-Host ""

$confirmation = Read-Host "Do you want to clear the icon cache? (Y/N)"
if ($confirmation -eq 'Y' -or $confirmation -eq 'y') {
    try {
        # Stop Explorer
        Write-Host "   Stopping Explorer.exe..." -ForegroundColor Gray
        Stop-Process -Name explorer -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 2
        
        # Delete icon cache files
        $iconCachePath = "$env:LOCALAPPDATA\IconCache.db"
        $iconCacheFolder = "$env:LOCALAPPDATA\Microsoft\Windows\Explorer"
        
        Write-Host "   Deleting icon cache files..." -ForegroundColor Gray
        
        if (Test-Path $iconCachePath) {
            Remove-Item $iconCachePath -Force -ErrorAction SilentlyContinue
            Write-Host "   ✅ Deleted IconCache.db" -ForegroundColor Green
        }
        
        if (Test-Path $iconCacheFolder) {
            Get-ChildItem $iconCacheFolder -Filter "iconcache*.db" | ForEach-Object {
                Remove-Item $_.FullName -Force -ErrorAction SilentlyContinue
                Write-Host "   ✅ Deleted $($_.Name)" -ForegroundColor Green
            }
            Get-ChildItem $iconCacheFolder -Filter "thumbcache*.db" | ForEach-Object {
                Remove-Item $_.FullName -Force -ErrorAction SilentlyContinue
                Write-Host "   ✅ Deleted $($_.Name)" -ForegroundColor Green
            }
        }
        
        # Restart Explorer
        Write-Host "   Restarting Explorer.exe..." -ForegroundColor Gray
        Start-Process explorer.exe
        Start-Sleep -Seconds 2
        
        Write-Host "✅ Icon cache cleared successfully!" -ForegroundColor Green
    } catch {
        Write-Host "❌ Error clearing icon cache: $_" -ForegroundColor Red
        # Make sure Explorer is running
        Start-Process explorer.exe -ErrorAction SilentlyContinue
    }
} else {
    Write-Host "   Skipped icon cache clearing." -ForegroundColor Gray
}

Write-Host ""

# Step 3: Instructions
Write-Host "Step 3: Next Steps" -ForegroundColor Yellow
Write-Host ""
Write-Host "To apply the icon fixes:" -ForegroundColor White
Write-Host "  1. Uninstall the current AutoLabel app (if installed)" -ForegroundColor Gray
Write-Host "  2. Run: npm run make" -ForegroundColor Cyan
Write-Host "  3. Install the new version from: out\make\squirrel.windows\x64\" -ForegroundColor Gray
Write-Host "  4. The new icon should now be displayed correctly" -ForegroundColor Gray
Write-Host ""
Write-Host "If the icon still doesn't show:" -ForegroundColor Yellow
Write-Host "  - Restart your computer (Windows sometimes needs a full restart)" -ForegroundColor Gray
Write-Host "  - Check if icon.ico contains multiple sizes (16x16, 32x32, 48x48, 256x256)" -ForegroundColor Gray
Write-Host ""

Write-Host "=== Done ===" -ForegroundColor Cyan

