# Script để start backend
Write-Host "Kiểm tra port 3000..." -ForegroundColor Cyan

# Kiểm tra và kill process trên port 3000
$processes = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
if ($processes) {
    foreach ($proc in $processes) {
        if ($proc -ne 0) {
            Write-Host "Dừng process $proc..." -ForegroundColor Yellow
            Stop-Process -Id $proc -Force -ErrorAction SilentlyContinue
        }
    }
}

Write-Host "Chờ 2 giây..." -ForegroundColor Cyan
Start-Sleep -Seconds 2

Write-Host "Starting backend server..." -ForegroundColor Green
npm run dev
