@echo off
echo ========================================
echo Starting TVU Python API Server
echo ========================================
echo.

REM Check if virtual environment exists
if exist venv (
    echo Activating virtual environment...
    call venv\Scripts\activate
) else (
    echo No virtual environment found. Using global Python.
)

echo.
echo Starting server on http://localhost:8001
echo Press Ctrl+C to stop
echo.

python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8001
