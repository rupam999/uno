# UNO No Mercy - Multiplayer Web Game

A real-time multiplayer UNO No Mercy game built with Next.js, Socket.IO, and TypeScript.

## Features

- ✅ Full UNO No Mercy rules (168 cards)
- ✅ Real-time multiplayer (2-10 players)
- ✅ Cumulative draw card stacking (+2, +4, +6, +10)
- ✅ Mercy rule (25 cards = elimination)
- ✅ Special cards (7 swap, 0 pass, Color Roulette)
- ✅ Mobile-friendly responsive design
- ✅ Dark mode UI
- ✅ Room code system for easy joining

## Getting Started

### Prerequisites
- Node.js 18+
- npm

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to play!

## Deployment

⚠️ **Important**: This app requires WebSocket support. See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.

### Quick Options:
1. **Vercel + Railway** (Recommended) - Split frontend/backend
2. **Railway** (Easiest) - All-in-one deployment
3. **Render** (Free tier) - All-in-one deployment

## How It Works

- **Frontend**: Next.js 16.2.4 with React 19.2.4
- **Backend**: Custom Socket.IO server for real-time gameplay
- **Real-time**: WebSocket connections sync game state across all players

See [DEPLOYMENT.md](./DEPLOYMENT.md) for deployment details.
