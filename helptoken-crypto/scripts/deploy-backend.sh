#!/bin/bash
echo "🖥️ Deploying backend..."

cd backend

# Build first
npm run build

# Deploy to Railway (you'll need to install railway CLI)
if command -v railway &> /dev/null; then
    echo "Deploying to Railway..."
    railway up
else
    echo "❌ Railway CLI not installed. Install with: npm install -g @railway/cli"
    echo "Alternative: Upload 'dist' folder to your hosting provider"
fi

cd ..