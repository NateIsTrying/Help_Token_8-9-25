#!/bin/bash
echo "🌐 Deploying frontend..."

cd frontend

# Build first
npm run build

# Deploy to Vercel (you'll need to install vercel CLI)
if command -v vercel &> /dev/null; then
    echo "Deploying to Vercel..."
    vercel --prod
else
    echo "❌ Vercel CLI not installed. Install with: npm install -g vercel"
    echo "Alternative: Upload 'out' folder to your hosting provider"
fi

cd ..
