#!/bin/bash

# Quick Deploy Script for Learning Tracker
# Run this to deploy to Vercel in one command

set -e

echo "🚀 Deploying Learning Tracker..."

# Check if already in a Vercel project
if [ -f ".vercel/project.json" ]; then
    echo "Deploying to existing Vercel project..."
    vercel --yes
else
    echo "First deployment - creating new Vercel project..."
    vercel --yes --prod
fi

echo "✅ Done! Your app is now live."
