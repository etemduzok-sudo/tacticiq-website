@echo off
echo ========================================
echo TacticIQ - Backend Server
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
    echo and add your API key.
    echo.
    pause
    exit /b 1
)

echo Starting backend server...
echo Server will run on http://localhost:3000
echo.
call npm run dev
