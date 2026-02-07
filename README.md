# Learning Tracker 🧠

A topic-agnostic learning app with spaced repetition and Socratic dialogue.

## Features

- 📚 **Topic Management** - Create and organize learning topics
- 🧠 **Spaced Repetition** - SM-2 algorithm for optimal memory retention
- ❓ **Socratic Quiz Mode** - Test yourself with flashcards
- 📊 **Progress Tracking** - Visualize your learning journey
- 🎯 **Key Ideas & Positions** - Track your understanding and evolving views

## Getting Started

### Local Development

```bash
npm install
npm run dev
```

### Deployment to Vercel

1. Push to GitHub:
```bash
git add .
git commit -m "Your changes"
git push origin main
```

2. Connect to Vercel:
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Vercel auto-detects Vite/React and deploys

### Manual Vercel Deploy

```bash
npm install -g vercel
vercel --yes
```

## Usage

1. **Create a Topic** - Click "+ New Topic" and name your learning subject
2. **Add Entry Questions** - Core questions you're exploring
3. **Record Your Positions** - Track your evolving views
4. **Add Key Ideas** - Important concepts to remember
5. **Create Flashcards** - Quiz yourself on key information
6. **Review Daily** - Spaced repetition keeps knowledge fresh

## Tech Stack

- React + Vite
- LocalStorage for data persistence
- Recharts for statistics
- PWA-ready for mobile

## Roadmap

- [ ] Cloud sync across devices
- [ ] Export/Import data
- [ ] Progress sharing
- [ ] Mobile app (React Native)
- [ ] AI-powered study suggestions

## License

MIT
