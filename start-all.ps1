# Script khởi động toàn bộ hệ thống TVU GDQP-AN Admin

Write-Host "🚀 Đang khởi động hệ thống TVU GDQP-AN Admin..." -ForegroundColor Cyan
Write-Host ""

# Kiểm tra thư mục hiện tại
$currentDir = Get-Location
Write-Host "📁 Thư mục hiện tại: $currentDir" -ForegroundColor Yellow

# 1. Khởi động Backend Python (OCR Service)
Write-Host ""
Write-Host "1️⃣  Khởi động Backend Python (OCR Service - Port 8000)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$currentDir\backend-python'; .\.venv\Scripts\Activate.ps1; Write-Host '🐍 Python Backend đang chạy tại http://localhost:8000' -ForegroundColor Green; uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"

Start-Sleep -Seconds 2

# 2. Khởi động Backend Node (API Service)
Write-Host ""
Write-Host "2️⃣  Khởi động Backend Node (API Service - Port 3000)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$currentDir\backend-node'; Write-Host '🟢 Node Backend đang chạy tại http://localhost:3000' -ForegroundColor Green; npm run dev"

Start-Sleep -Seconds 2

# 3. Khởi động Frontend
Write-Host ""
Write-Host "3️⃣  Khởi động Frontend (React - Port 5173)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$currentDir\frontend'; Write-Host '⚛️  Frontend đang chạy tại http://localhost:5173' -ForegroundColor Green; npm run dev"

Write-Host ""
Write-Host "✅ Đã khởi động tất cả services!" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 Danh sách services:" -ForegroundColor Yellow
Write-Host "   • Python Backend (OCR):  http://localhost:8000" -ForegroundColor White
Write-Host "   • Node Backend (API):    http://localhost:3000" -ForegroundColor White
Write-Host "   • Frontend (React):      http://localhost:5173" -ForegroundColor White
Write-Host ""
Write-Host "🌐 Mở trình duyệt tại: http://localhost:5173" -ForegroundColor Cyan
Write-Host ""
Write-Host "💡 Tip: Đóng tất cả terminal để dừng services" -ForegroundColor Gray
Write-Host ""

# Chờ 3 giây rồi mở trình duyệt
Start-Sleep -Seconds 3
Start-Process "http://localhost:5173"
