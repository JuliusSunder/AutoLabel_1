@echo off
REM AutoLabel Release Build Script
REM Builds production-ready installer with proper branding

echo ========================================
echo   AutoLabel Release Build
echo ========================================
echo.

echo [1/4] Cleaning build cache...
call npm run clean
if %errorlevel% neq 0 (
    echo ERROR: Clean failed
    exit /b %errorlevel%
)

echo.
echo [2/4] Verifying icons...
if not exist "icons\icon_256x256.png" (
    echo WARNING: Icons not found. Generating...
    node build-icons.js
    if %errorlevel% neq 0 (
        echo ERROR: Icon generation failed
        exit /b %errorlevel%
    )
)
echo Icons OK

echo.
echo [3/4] Building production package...
call npm run make
if %errorlevel% neq 0 (
    echo ERROR: Build failed
    exit /b %errorlevel%
)

echo.
echo [4/4] Build complete!
echo.
echo Output location:
echo   Windows: out\make\squirrel.windows\x64\
echo   Installer: AutoLabel-1.0.0 Setup.exe
echo.
echo ========================================
echo   Build successful!
echo ========================================
echo.
pause

