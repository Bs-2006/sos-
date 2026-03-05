@echo off
echo ========================================
echo LifeLink AI Agents Setup
echo ========================================
echo.

echo Installing dependencies...
call npm install

echo.
echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Copy .env.example to .env
echo 2. Add your API keys to .env:
echo    - GITHUB_TOKEN
echo    - TWILIO credentials
echo    - AZURE_SPEECH_KEY
echo 3. Run 'npm run dev' to start the server
echo.
echo For detailed setup instructions, see:
echo backend/agents/README.md
echo.
pause
