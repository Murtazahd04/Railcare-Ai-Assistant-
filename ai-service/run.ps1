# ========================================================
# Starting SRLMS AI Microservice (FastAPI on Port 8001)
# ========================================================
Set-Location $PSScriptRoot
Write-Host "Starting SRLMS AI Microservice on http://localhost:8001..." -ForegroundColor Cyan
& "$PSScriptRoot\venv\Scripts\python.exe" -m uvicorn main:app --port 8001 --reload
