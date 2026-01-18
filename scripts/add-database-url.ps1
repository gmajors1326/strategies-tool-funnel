# Add DATABASE_URL to Vercel
# Usage: .\scripts\add-database-url.ps1 "postgresql://postgres:password@host:5432/postgres"

param(
    [Parameter(Mandatory=$true)]
    [string]$DatabaseUrl
)

Write-Host "🔐 Adding DATABASE_URL to Vercel..." -ForegroundColor Cyan

# Check if Vercel CLI is installed
try {
    $vercelVersion = vercel --version
    Write-Host "✅ Vercel CLI found: $vercelVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Vercel CLI not found. Install it with: npm i -g vercel" -ForegroundColor Red
    exit 1
}

Write-Host "📤 Adding DATABASE_URL..." -ForegroundColor Yellow

# Use echo to pipe the value to vercel env add
$DatabaseUrl | vercel env add DATABASE_URL production

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ DATABASE_URL added successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Verify with: vercel env ls" -ForegroundColor Cyan
} else {
    Write-Host "❌ Failed to add DATABASE_URL" -ForegroundColor Red
    exit 1
}
