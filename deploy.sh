#!/bin/bash

# Deploy Learning Tracker to Vercel
# Run: chmod +x deploy.sh && ./deploy.sh

echo "🚀 Deploying Learning Tracker to Vercel..."

# Check if Vercel is installed
if ! command -v vercel &> /dev/null; then
    echo "Installing Vercel..."
    npm install -g vercel
fi

# Deploy
vercel --yes

echo "✅ Deployment complete!"
