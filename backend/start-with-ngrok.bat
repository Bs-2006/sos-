@echo off
echo ========================================
echo LifeLink Backend with Ngrok Setup
echo ========================================
echo.

echo Step 1: Starting ngrok...
echo Please open a NEW terminal and run: ngrok http 3000
echo.
echo Step 2: Copy the ngrok URL (https://xxxx.ngrok-free.app)
echo.
echo Step 3: Update PUBLIC_URL in .env file with the ngrok URL
echo.
echo Step 4: Restart the backend server
echo.

pause

echo.
echo Starting backend server...
npm start
