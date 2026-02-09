# Helper script - use npm.cmd to bypass PowerShell execution policy
# Usage: .\run.ps1 migrate | seed | dev

param([string]$Command = "dev")

switch ($Command.ToLower()) {
  "migrate" { npm.cmd run migrate --workspace=backend }
  "seed"    { npm.cmd run seed --workspace=backend }
  "dev"     { npm.cmd run dev }
  default   { 
    Write-Host "Usage: .\run.ps1 [migrate|seed|dev]"
    Write-Host "  migrate - Run database migrations"
    Write-Host "  seed    - Populate mock data"
    Write-Host "  dev     - Start frontend + backend"
  }
}
