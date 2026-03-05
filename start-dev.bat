@echo off
REM LifeLink Development Startup Script for Windows

echo Starting LifeLink Development Environment...

REM Start Backend API
echo Starting Backend API...
cd backend
if not exist node_modules (
    echo Installing backend dependencies...
    call npm install
)
start "Backend API" cmd /k npm run dev
cd ..

REM Wait for backend to start
timeout /t 3 /nobreak >nul

REM Start Mobile App
echo Starting Mobile App...
cd mobile
if not exist node_modules (
    echo Installing mobile dependencies...
    call npm install
)
start "Mobile App" cmd /k npm start
cd ..

echo.
echo All services started!
echo.
echo Backend API:   http://localhost:3000
echo Mobile App:    Check Expo DevTools
echo.
echo Close the terminal windows to stop services
