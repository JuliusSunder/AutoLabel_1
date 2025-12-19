@echo off
REM AutoLabel - Fresh Start Script
REM This script ensures you always get the latest version

echo.
echo Cleaning cached builds...
echo.

if exist .vite (
    rmdir /s /q .vite
    echo [OK] Removed .vite cache
) else (
    echo [OK] No .vite cache found
)

if exist out (
    rmdir /s /q out
    echo [OK] Removed out directory
)

echo.
echo Starting AutoLabel with fresh build...
echo.

npm run start

