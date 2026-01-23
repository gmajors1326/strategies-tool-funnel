#!/bin/bash

# Deploy script for Strategy Tools Funnel
# Usage: ./scripts/deploy.sh [commit-message]

set -e

COMMIT_MSG="${1:-Update: Automated deployment}"

echo "🚀 Starting deployment process..."

# Check if we're on main branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ]; then
    echo "⚠️  Warning: Not on main branch (currently on $CURRENT_BRANCH)"
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Check for uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
    echo "📝 Staging changes..."
    git add .
    
    echo "💾 Committing changes..."
    git commit -m "$COMMIT_MSG"
else
    echo "✅ No changes to commit"
fi

# Push to GitHub
echo "📤 Pushing to GitHub..."
git push origin main

echo "✅ Pushed to GitHub successfully!"
echo ""
echo "📋 Next steps:"
echo "   1. Vercel will automatically deploy on push to main"
echo "   2. Monitor deployment at: https://vercel.com/dashboard"
echo "   3. Check GitHub Actions: https://github.com/gmajors1326/strategies-tool-funnel/actions"
echo ""
echo "🎉 Deployment initiated!"
