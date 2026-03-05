@echo off
echo Cleaning project...
rmdir /s /q .expo 2>nul
rmdir /s /q android\app\build 2>nul
rmdir /s /q android\build 2>nul

echo Clearing Metro cache...
call npx expo start --clear --reset-cache

echo.
echo Metro bundler started. Now:
echo 1. Uninstall the app from your device
echo 2. Scan the QR code with Expo Go
echo.
pause
