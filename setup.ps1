# Group Running App - Setup Script
# Run this script to start Docker, migrate, seed, and launch the app

Write-Host "=== Group Running App Setup ===" -ForegroundColor Cyan

# 1. Start Docker containers
Write-Host "`n[1/4] Starting Docker (PostgreSQL, Redis)..." -ForegroundColor Yellow
docker-compose up -d
if ($LASTEXITCODE -ne 0) {
    Write-Host "Docker failed. Make sure Docker Desktop is running." -ForegroundColor Red
    exit 1
}
Write-Host "  Done." -ForegroundColor Green

# 2. Wait for PostgreSQL to be ready
Write-Host "`n[2/4] Waiting for database (5s)..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# 3. Migrate and seed
Write-Host "`n[3/4] Running database migration..." -ForegroundColor Yellow
npm run migrate --workspace=backend
if ($LASTEXITCODE -ne 0) {
    Write-Host "Migration failed." -ForegroundColor Red
    exit 1
}
Write-Host "  Done." -ForegroundColor Green

Write-Host "`n[4/4] Seeding mock data..." -ForegroundColor Yellow
npm run seed --workspace=backend
if ($LASTEXITCODE -ne 0) {
    Write-Host "Seed failed." -ForegroundColor Red
    exit 1
}
Write-Host "  Done." -ForegroundColor Green

Write-Host "`n=== Setup complete! ===" -ForegroundColor Cyan
Write-Host "`nStart the app with: npm run dev" -ForegroundColor White
Write-Host "  Frontend: http://localhost:3000" -ForegroundColor White
Write-Host "  Backend:  http://localhost:5000" -ForegroundColor White
Write-Host "`nLogin: alice@test.com / Test1234!" -ForegroundColor Gray
