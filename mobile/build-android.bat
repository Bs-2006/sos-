@echo off
echo ======================================
echo   LifeLink Android Build Script
echo ======================================
echo.

REM Check if EAS CLI is installed
where eas >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Installing EAS CLI...
    call npm install -g eas-cli
)

echo EAS CLI is installed
echo.

REM Check if logged in
echo Checking Expo login status...
call eas whoami
if %ERRORLEVEL% NEQ 0 (
    echo Not logged in to Expo
    echo Please run: eas login
    exit /b 1
)

echo.
echo Select build type:
echo 1) Preview (APK for testing) - Recommended
echo 2) Production (APK for release)
echo 3) Development (with dev tools)
echo.
set /p choice="Enter choice (1-3): "

if "%choice%"=="1" (
    echo.
    echo Starting PREVIEW build...
    echo This will take 10-20 minutes
    echo.
    call eas build --platform android --profile preview
) else if "%choice%"=="2" (
    echo.
    echo Starting PRODUCTION build...
    echo This will take 10-20 minutes
    echo.
    call eas build --platform android --profile production
) else if "%choice%"=="3" (
    echo.
    echo Starting DEVELOPMENT build...
    echo This will take 10-20 minutes
    echo.
    call eas build --platform android --profile development
) else (
    echo Invalid choice
    exit /b 1
)

echo.
echo Build started!
echo.
echo You can:
echo - Wait here for completion
echo - Check status: eas build:list
echo - View on web: https://expo.dev
echo.
pause
