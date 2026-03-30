@echo off
REM TVU GDQP Admin - Docker Deployment Script for Windows

echo Starting TVU GDQP Admin Deployment...

REM Check if Docker is installed
docker --version >nul 2>&1
if errorlevel 1 (
    echo Error: Docker is not installed. Please install Docker Desktop first.
    exit /b 1
)

REM Check if Docker Compose is installed
docker-compose --version >nul 2>&1
if errorlevel 1 (
    echo Error: Docker Compose is not installed. Please install Docker Compose first.
    exit /b 1
)

REM Check environment files
echo Checking environment files...

if not exist "backend-node\.env" (
    echo Warning: backend-node\.env not found. Copying from .env.example...
    copy "backend-node\.env.example" "backend-node\.env"
)

if not exist "frontend\.env" (
    echo Warning: frontend\.env not found. Copying from .env.example...
    copy "frontend\.env.example" "frontend\.env"
)

REM Stop existing containers
echo Stopping existing containers...
docker-compose down

REM Build images
echo Building Docker images...
docker-compose build --no-cache

REM Start services
echo Starting services...
docker-compose up -d

REM Wait for services
echo Waiting for services to start...
timeout /t 10 /nobreak >nul

REM Check service status
echo Checking service status...
docker-compose ps

echo.
echo Deployment completed!
echo.
echo Services are running at:
echo   - Frontend:        http://localhost
echo   - Backend Node:    http://localhost:3000
echo   - Backend Python:  http://localhost:8000
echo   - Mongo Express:   http://localhost:8081
echo   - pgAdmin:         http://localhost:5050
echo.
echo To view logs: docker-compose logs -f
echo To stop: docker-compose down
