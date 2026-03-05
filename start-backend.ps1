# ── Khởi động backend Python (OCR + Document AI + Vision API) ─────────────────
Set-Location "$PSScriptRoot\backend-python"

# Kiểm tra Python
if (-not (Get-Command python -ErrorAction SilentlyContinue)) {
    Write-Error "Python chưa được cài. Tải tại https://www.python.org/downloads/"
    exit 1
}

# Tạo virtualenv nếu chưa có
if (-not (Test-Path ".venv")) {
    Write-Host "Tạo virtualenv..." -ForegroundColor Cyan
    python -m venv .venv
}

# Activate
.\.venv\Scripts\Activate.ps1

# Cài dependencies
Write-Host "Cài dependencies..." -ForegroundColor Cyan
pip install -r requirements.txt -q

# Kiểm tra file .env
if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Warning "File .env đã được tạo từ .env.example. Hãy điền GOOGLE_CLOUD_PROJECT_ID, DOCUMENTAI_PROCESSOR_ID, GOOGLE_APPLICATION_CREDENTIALS."
}

# Khởi động
Write-Host ""
Write-Host "✅ Đang khởi động backend tại http://localhost:8000 ..." -ForegroundColor Green
Write-Host "   API docs: http://localhost:8000/docs" -ForegroundColor Green
Write-Host "   Dừng: Ctrl+C" -ForegroundColor Yellow
Write-Host ""
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
