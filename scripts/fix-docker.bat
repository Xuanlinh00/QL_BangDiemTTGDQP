@echo off
echo ========================================
echo   TVU GDQP Admin - Docker Fix Script
echo ========================================
echo.

echo [1/5] Stopping development processes...
taskkill /IM node.exe /F 2>nul
if %errorlevel% equ 0 (
    echo   - Node.js processes stopped
) else (
    echo   - No Node.js processes running
)
echo.

echo [2/5] Stopping Docker containers...
docker-compose down
echo.

echo [3/5] Starting Docker services...
docker-compose up -d
echo.

echo [4/5] Waiting for services to start...
timeout /t 20 /nobreak >nul
echo.

echo [5/5] Checking service status...
docker-compose ps
echo.

echo ========================================
echo   Deployment Complete!
echo ========================================
echo.
echo Services should be available at:
echo   - Frontend:        http://localhost
echo   - Backend Node:    http://localhost:3000
echo   - Mongo Express:   http://localhost:8081
echo.
echo To view logs: docker-compose logs -f
echo To stop: docker-compose down
echo.
pause
