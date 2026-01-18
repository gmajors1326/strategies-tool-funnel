#!/bin/bash

# Add DATABASE_URL to Vercel
# Usage: ./scripts/add-database-url.sh "postgresql://postgres:password@host:5432/postgres"

if [ -z "$1" ]; then
    echo "❌ Error: DATABASE_URL required"
    echo "Usage: ./scripts/add-database-url.sh \"postgresql://postgres:password@host:5432/postgres\""
    exit 1
fi

DATABASE_URL="$1"

echo "🔐 Adding DATABASE_URL to Vercel..."

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Install it with: npm i -g vercel"
    exit 1
fi

echo "✅ Vercel CLI found: $(vercel --version)"
echo "📤 Adding DATABASE_URL..."

echo "$DATABASE_URL" | vercel env add DATABASE_URL production

if [ $? -eq 0 ]; then
    echo "✅ DATABASE_URL added successfully!"
    echo ""
    echo "Verify with: vercel env ls"
else
    echo "❌ Failed to add DATABASE_URL"
    exit 1
fi
