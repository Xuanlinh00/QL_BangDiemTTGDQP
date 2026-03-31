# ── Khởi động backend Node.js ─────────────────
Set-Location "$PSScriptRoot\backend-node"

# Kiểm tra Node.js
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Error "Node.js chưa được cài. Tải tại https://nodejs.org/"
    exit 1
}

# Cài dependencies nếu chưa có
if (-not (Test-Path "node_modules")) {
    Write-Host "Cài dependencies..." -ForegroundColor Cyan
    npm install
}

# Kiểm tra file .env
if (-not (Test-Path ".env")) {
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env"
        Write-Warning "File .env đã được tạo từ .env.example. Hãy cấu hình các biến môi trường cần thiết."
    }
}

# Khởi động
Write-Host ""
Write-Host "✅ Đang khởi động backend tại http://localhost:3000 ..." -ForegroundColor Green
Write-Host "   Dừng: Ctrl+C" -ForegroundColor Yellow
Write-Host ""
npm run dev
