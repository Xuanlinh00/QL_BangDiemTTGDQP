@echo off
echo ========================================
echo   TVU GDQP Admin - Docker Fix Script
echo ========================================
echo.

echo [1/6] Stopping development processes...
taskkill /IM node.exe /F 2>nul
if %errorlevel% equ 0 (
    echo   - Node.js processes stopped
) else (
    echo   - No Node.js processes running
)

taskkill /IM python.exe /F 2>nul
if %errorlevel% equ 0 (
    echo   - Python processes stopped
) else (
    echo   - No Python processes running
)
echo.

echo [2/6] Creating backend-python .env file...
if not exist "backend-python\.env" (
    (
        echo MONGODB_URL=mongodb://admin:password@mongodb:27017
        echo MONGODB_DB_NAME=tvu_documents
        echo GEMINI_API_KEY=
        echo GOOGLE_APPLICATION_CREDENTIALS=/app/google-credentials.json
        echo TESSERACT_PATH=/usr/bin/tesseract
        echo OCR_LANGUAGE=vie
        echo API_HOST=0.0.0.0
        echo API_PORT=8000
    ) > backend-python\.env
    echo   - Created backend-python\.env
) else (
    echo   - backend-python\.env already exists
)
echo.

echo [3/6] Stopping Docker containers...
docker-compose down
echo.

echo [4/6] Starting Docker services...
docker-compose up -d
echo.

echo [5/6] Waiting for services to start...
timeout /t 20 /nobreak >nul
echo.

echo [6/6] Checking service status...
docker-compose ps
echo.

echo ========================================
echo   Deployment Complete!
echo ========================================
echo.
echo Services should be available at:
echo   - Frontend:        http://localhost
echo   - Backend Node:    http://localhost:3000
echo   - Backend Python:  http://localhost:8000
echo   - Mongo Express:   http://localhost:8081
echo   - pgAdmin:         http://localhost:5050
echo.
echo To view logs: docker-compose logs -f
echo To stop: docker-compose down
echo.
pause
