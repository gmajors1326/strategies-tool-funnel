# Quick script to add DATABASE_URL to Vercel
# Usage: .\scripts\add-db-url-quick.ps1

Write-Host "🔐 Adding DATABASE_URL to Vercel`n" -ForegroundColor Cyan

# Prompt for password securely
$password = Read-Host "Enter your Supabase database password" -AsSecureString
$plainPassword = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($password)
)

# Construct DATABASE_URL
$databaseUrl = "postgresql://postgres:$plainPassword@db.ezdpaqrfrzmbokwpknhb.supabase.co:5432/postgres"

Write-Host "`n📤 Adding to Vercel..." -ForegroundColor Yellow

# Add to Vercel (non-interactive)
$databaseUrl | vercel env add DATABASE_URL production --yes

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ DATABASE_URL added successfully!`n" -ForegroundColor Green
    Write-Host "Verify with: vercel env ls" -ForegroundColor Cyan
} else {
    Write-Host "❌ Failed to add DATABASE_URL" -ForegroundColor Red
    Write-Host "Try manually: vercel env add DATABASE_URL production" -ForegroundColor Yellow
}

# Clear password from memory
$plainPassword = $null
$password = $null
