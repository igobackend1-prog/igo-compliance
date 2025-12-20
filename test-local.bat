@echo off
REM IGO Payment Approval Application - Local Testing Script for Windows
REM This script automates the 10-minute local testing setup

echo.
echo ========================================
echo IGO PAYMENT APPROVAL - LOCAL TEST SETUP
echo ========================================
echo.
echo This script will:
echo 1. Clone the repository
echo 2. Install dependencies
echo 3. Setup environment variables
echo 4. Start the development server
echo 5. Open the application in your browser
echo.
echo Time required: ~10 minutes
echo.
pause

echo.
echo [STEP 1] Cloning repository...
echo .
git clone https://github.com/igobackend1-prog/igo-approvals.git
cd igo-approvals

echo.
echo [STEP 2] Installing dependencies...
echo This will take 3-4 minutes. Please wait...
echo .
npm install

echo.
echo [STEP 3] Setting up environment variables...
echo .
if not exist .env.local (
    copy .env.example .env.local
    echo Environment file created: .env.local
) else (
    echo Environment file already exists: .env.local
)

echo.
echo [STEP 4] Starting development server...
echo .
echo Application will start on: http://localhost:5173
echo .
echo To stop the server, press Ctrl+C
echo .
pause

npm run dev

echo.
echo ========================================
echo Testing Complete!
echo ========================================
echo.
echo To stop the server, press Ctrl+C (already done if shown above)
echo .
echo Next steps:
echo 1. Review LOCAL-TESTING-GUIDE.md for detailed information
echo 2. For deployment: Follow DEPLOYMENT-STATUS.md
echo 3. For cloud deployment: Follow DEPLOYMENT.md
echo.
pause
