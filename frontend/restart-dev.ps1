# Restart dev server script
Write-Host "Restarting frontend dev server..." -ForegroundColor Cyan

# Kill any existing npm/node processes on port 5173
$processes = Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
if ($processes) {
    foreach ($proc in $processes) {
        Stop-Process -Id $proc -Force -ErrorAction SilentlyContinue
        Write-Host "Killed process $proc" -ForegroundColor Yellow
    }
}

# Wait a bit
Start-Sleep -Seconds 2

# Start dev server
Write-Host "Starting dev server..." -ForegroundColor Green
npm run dev
