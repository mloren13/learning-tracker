# 🚀 Quick Deploy to Vercel

## Option 1: One-Click via Vercel Dashboard (Easiest)

1. Go to: https://vercel.com/new
2. Select: **Import Git Repository**
3. Choose: **mloren13/learning-tracker**
4. Click: **Deploy**
5. ✅ Done! Your app is live at `https://learning-tracker.vercel.app`

## Option 2: Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login (requires Vercel account)
vercel login

# Deploy (from project folder)
vercel --prod
```

## Option 3: GitHub Integration (Auto-deploy on push)

1. Go to https://vercel.com/import/git
2. Import your GitHub repo
3. Settings auto-detected for Vite/React
4. Every `git push` auto-deploys!

## After Deployment

Your app URL: `https://learning-tracker.vercel.app`

Features included:
- ✅ Spaced repetition with SM-2 algorithm
- ✅ Topic management with entry questions & positions
- ✅ Flashcard quiz mode
- ✅ Progress tracking & statistics
- ✅ LocalStorage persistence (no backend needed)

## Update Your App

```bash
git add .
git commit -m "Your changes"
git push origin main
# Vercel auto-deploys on push!
```
