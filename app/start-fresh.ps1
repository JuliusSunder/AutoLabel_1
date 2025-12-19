# AutoLabel - Fresh Start Script
# This script ensures you always get the latest version

Write-Host "🧹 Cleaning cached builds..." -ForegroundColor Cyan

# Remove .vite build cache
if (Test-Path .vite) {
    Remove-Item -Recurse -Force .vite
    Write-Host "✓ Removed .vite cache" -ForegroundColor Green
} else {
    Write-Host "✓ No .vite cache found" -ForegroundColor Green
}

# Remove out directory if it exists
if (Test-Path out) {
    Remove-Item -Recurse -Force out
    Write-Host "✓ Removed out directory" -ForegroundColor Green
}

Write-Host ""
Write-Host "🚀 Starting AutoLabel with fresh build..." -ForegroundColor Cyan
Write-Host ""

# Start the app
npm run start

