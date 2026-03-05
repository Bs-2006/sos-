@echo off
echo Clearing React Native / Expo cache...

REM Clear metro bundler cache
del /s /q %TEMP%\metro-* 2>nul
del /s /q %TEMP%\react-* 2>nul

REM Clear npm cache
call npm cache clean --force

REM Clear expo cache  
echo Starting expo with cleared cache...
call npx expo start --clear

echo Cache cleared!
