@echo off
echo Building APK without OTA updates...
echo.

echo Step 1: Cleaning build directories...
rmdir /s /q android\app\build 2>nul
rmdir /s /q android\build 2>nul

echo Step 2: Running prebuild...
call npx expo prebuild --platform android --clean

echo Step 3: Building release APK...
cd android
call gradlew clean
call gradlew assembleRelease
cd ..

echo.
echo Build complete! APK location:
echo android\app\build\outputs\apk\release\app-release.apk
echo.
pause
