# Push environment variables to Vercel
# Usage: .\scripts\push-env-to-vercel.ps1

Write-Host "🔐 Pushing environment variables to Vercel..." -ForegroundColor Cyan

# Check if .env file exists
if (-not (Test-Path .env)) {
    Write-Host "❌ .env file not found!" -ForegroundColor Red
    Write-Host "Please create a .env file with your environment variables." -ForegroundColor Yellow
    exit 1
}

# Check if Vercel CLI is installed
try {
    $vercelVersion = vercel --version
    Write-Host "✅ Vercel CLI found: $vercelVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Vercel CLI not found. Install it with: npm i -g vercel" -ForegroundColor Red
    exit 1
}

# Read .env file
Write-Host "📖 Reading .env file..." -ForegroundColor Yellow
$envVars = @{}
Get-Content .env | ForEach-Object {
    if ($_ -match '^\s*([^#][^=]+)=(.*)$') {
        $key = $matches[1].Trim()
        $value = $matches[2].Trim()
        # Remove quotes if present
        $value = $value -replace '^["\'](.*)["\']$', '$1'
        if ($key -and $value) {
            $envVars[$key] = $value
        }
    }
}

if ($envVars.Count -eq 0) {
    Write-Host "❌ No environment variables found in .env file!" -ForegroundColor Red
    exit 1
}

Write-Host "📋 Found $($envVars.Count) environment variables" -ForegroundColor Green
Write-Host ""

# Ask for confirmation
Write-Host "The following variables will be pushed to Vercel:" -ForegroundColor Yellow
foreach ($key in $envVars.Keys) {
    $displayValue = if ($key -match 'SECRET|KEY|PASSWORD|TOKEN') {
        "***hidden***"
    } else {
        $envVars[$key]
    }
    Write-Host "  $key = $displayValue" -ForegroundColor Gray
}

Write-Host ""
$confirm = Read-Host "Continue? (y/n)"
if ($confirm -ne "y" -and $confirm -ne "Y") {
    Write-Host "❌ Cancelled" -ForegroundColor Red
    exit 1
}

# Push each variable to Vercel
Write-Host ""
Write-Host "🚀 Pushing to Vercel..." -ForegroundColor Cyan

$successCount = 0
$failCount = 0

foreach ($key in $envVars.Keys) {
    $value = $envVars[$key]
    Write-Host "Setting $key..." -ForegroundColor Gray -NoNewline
    
    try {
        # Use vercel env add command
        $result = vercel env add $key production 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host " ✅" -ForegroundColor Green
            $successCount++
        } else {
            # Try to update if it already exists
            Write-Host " (updating...)" -ForegroundColor Yellow -NoNewline
            $updateResult = vercel env rm $key production --yes 2>&1
            $addResult = vercel env add $key production 2>&1
            if ($LASTEXITCODE -eq 0) {
                Write-Host " ✅" -ForegroundColor Green
                $successCount++
            } else {
                Write-Host " ❌ Failed" -ForegroundColor Red
                $failCount++
            }
        }
    } catch {
        Write-Host " ❌ Error: $_" -ForegroundColor Red
        $failCount++
    }
}

Write-Host ""
Write-Host "📊 Summary:" -ForegroundColor Cyan
Write-Host "  ✅ Success: $successCount" -ForegroundColor Green
Write-Host "  ❌ Failed: $failCount" -ForegroundColor Red
Write-Host ""
Write-Host "💡 Note: You may need to manually set some variables via Vercel dashboard:" -ForegroundColor Yellow
Write-Host "   https://vercel.com/dashboard" -ForegroundColor Cyan
Write-Host ""
Write-Host "💡 For interactive setup, run: vercel env add" -ForegroundColor Yellow
