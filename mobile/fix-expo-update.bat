@echo off
REM Fix Expo update error

echo 🔧 Fixing Expo update error...

REM Clear Expo cache
echo 1. Clearing Expo cache...
npx expo start -c

echo ✅ Done! Try starting the app again with: npm start
