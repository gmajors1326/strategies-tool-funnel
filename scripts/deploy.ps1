# Deploy script for Strategy Tools Funnel (PowerShell)
# Usage: .\scripts\deploy.ps1 [-CommitMessage "Your message"]

param(
    [string]$CommitMessage = "Update: Automated deployment"
)

Write-Host "🚀 Starting deployment process..." -ForegroundColor Cyan

# Check if we're on main branch
$currentBranch = git branch --show-current
if ($currentBranch -ne "main") {
    Write-Host "⚠️  Warning: Not on main branch (currently on $currentBranch)" -ForegroundColor Yellow
    $continue = Read-Host "Continue anyway? (y/n)"
    if ($continue -ne "y" -and $continue -ne "Y") {
        exit 1
    }
}

# Check for uncommitted changes
$status = git status --porcelain
if ($status) {
    Write-Host "📝 Staging changes..." -ForegroundColor Yellow
    git add .
    
    Write-Host "💾 Committing changes..." -ForegroundColor Yellow
    git commit -m $CommitMessage
} else {
    Write-Host "✅ No changes to commit" -ForegroundColor Green
}

# Push to GitHub
Write-Host "📤 Pushing to GitHub..." -ForegroundColor Cyan
git push origin main

Write-Host "✅ Pushed to GitHub successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next steps:" -ForegroundColor Cyan
Write-Host "   1. Vercel will automatically deploy on push to main"
Write-Host "   2. Monitor deployment at: https://vercel.com/dashboard"
Write-Host "   3. Check GitHub Actions: https://github.com/gmajors1326/strategies-tool-funnel/actions"
Write-Host ""
Write-Host "🎉 Deployment initiated!" -ForegroundColor Green
