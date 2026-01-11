@echo off
echo ========================================
echo Fan Manager 2026 - Backend with Monitoring
echo ========================================
echo.

REM Check if node_modules exists
if not exist "node_modules\" (
    echo Installing dependencies...
    call npm install
    echo.
)

REM Check if .env exists
if not exist ".env" (
    echo WARNING: .env file not found!
    echo Please create .env file from .env.example
    echo and add your SMTP credentials for monitoring.
    echo.
    pause
    exit /b 1
)

echo Starting backend server with monitoring...
echo Server will run on http://localhost:3000
echo Monitoring will start automatically after 10 seconds
echo.
call npm run dev
