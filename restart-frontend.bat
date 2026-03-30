@echo off
REM Script to restart frontend with new environment variables

echo.
echo ========================================
echo   Restarting Frontend with Render API
echo ========================================
echo.

cd frontend
if %errorlevel% neq 0 (
  echo Error: frontend directory not found
  exit /b 1
)

echo Current API URL configuration:
echo.
findstr "VITE_API_URL" .env
echo.

echo Starting frontend development server...
echo Frontend will connect to: https://tvu-backend-node.onrender.com/api
echo.
echo Press Ctrl+C to stop the server
echo.

call npm run dev
