#!/usr/bin/env pwsh
# Script to restart the backend server

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Restarting Backend Server..." -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Find and kill existing node processes running on port 3000
Write-Host "Stopping existing backend processes..." -ForegroundColor Yellow

# Get process using port 3000
$port3000 = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
if ($port3000) {
    $processId = $port3000.OwningProcess
    Write-Host "Found process $processId using port 3000" -ForegroundColor Yellow
    Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
    Write-Host "Stopped process $processId" -ForegroundColor Green
    Start-Sleep -Seconds 2
}

# Navigate to backend directory
Set-Location backend-node

# Build TypeScript
Write-Host "Building TypeScript..." -ForegroundColor Yellow
npm run build

# Start the server
Write-Host ""
Write-Host "Starting server on http://localhost:3000" -ForegroundColor Green
Write-Host "Press Ctrl+C to stop" -ForegroundColor Yellow
Write-Host ""

npm start
