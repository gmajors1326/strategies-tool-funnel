#!/bin/bash

# Push environment variables to Vercel
# Usage: ./scripts/push-env-to-vercel.sh

set -e

echo "🔐 Pushing environment variables to Vercel..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    echo "Please create a .env file with your environment variables."
    exit 1
fi

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Install it with: npm i -g vercel"
    exit 1
fi

echo "✅ Vercel CLI found: $(vercel --version)"

# Read .env file and push to Vercel
echo "📖 Reading .env file..."

while IFS='=' read -r key value || [ -n "$key" ]; do
    # Skip empty lines and comments
    [[ -z "$key" || "$key" =~ ^[[:space:]]*# ]] && continue
    
    # Remove quotes if present
    value=$(echo "$value" | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//")
    
    if [ -n "$key" ] && [ -n "$value" ]; then
        echo -n "Setting $key..."
        
        # Try to add, if it exists, remove first then add
        if vercel env add "$key" production <<< "$value" 2>/dev/null; then
            echo " ✅"
        else
            echo -n " (updating...)"
            vercel env rm "$key" production --yes 2>/dev/null || true
            if vercel env add "$key" production <<< "$value" 2>/dev/null; then
                echo " ✅"
            else
                echo " ❌ Failed"
            fi
        fi
    fi
done < .env

echo ""
echo "💡 Note: You may need to manually set some variables via Vercel dashboard:"
echo "   https://vercel.com/dashboard"
echo ""
echo "💡 For interactive setup, run: vercel env add"
