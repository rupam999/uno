# UNO No Mercy - Deployment Guide

## Architecture

This app requires TWO deployments:
1. **Frontend (Next.js)** - Deploy to Vercel
2. **Backend (Socket.IO Server)** - Deploy to Railway/Render/Fly.io

## Why Two Deployments?

Vercel's serverless architecture doesn't support persistent WebSocket connections required by Socket.IO. Therefore, we need to deploy the WebSocket server separately.

---

## Option 1: Vercel + Railway (Recommended)

### Step 1: Deploy Backend to Railway

1. Go to [Railway.app](https://railway.app)
2. Click "New Project" → "Deploy from GitHub repo"
3. Select this repository
4. Add these settings:
   - **Start Command**: `npm run start:server` (or use the default)
   - **Build Command**: `npm install`
5. Railway will automatically assign a URL like: `https://your-app.railway.app`
6. Copy this URL - you'll need it for the frontend

### Step 2: Deploy Frontend to Vercel

1. Go to [Vercel](https://vercel.com)
2. Import this repository
3. Add Environment Variable:
   - **Name**: `NEXT_PUBLIC_SOCKET_URL`
   - **Value**: `https://your-app.railway.app` (from Railway)
4. Deploy!

---

## Option 2: All-in-One Deployment (Railway/Render)

If you want everything in one place, deploy to Railway or Render:

### Railway:
1. Create new project from GitHub
2. Set start command: `npm start`
3. That's it! Railway handles both frontend and WebSocket server

### Render:
1. Create new Web Service
2. Set build command: `npm install && npm run build`
3. Set start command: `npm start`
4. Deploy!

---

## Environment Variables

### For Split Deployment (Vercel + Railway):

**.env.production (Vercel)**
```
NEXT_PUBLIC_SOCKET_URL=https://your-backend.railway.app
```

**.env (Railway)**
```
PORT=3000
NODE_ENV=production
```

### For All-in-One Deployment:

No environment variables needed - it will use the same origin.

---

## Vercel Configuration

The `vercel.json` file is already configured. It tells Vercel to:
- Build the Next.js app only
- Not try to handle WebSocket connections

---

## Testing Your Deployment

1. Open your Vercel URL: `https://your-app.vercel.app`
2. Create a game
3. Open another browser/device
4. Join with the room code
5. Play!

---

## Troubleshooting

### "Cannot connect to server"
- Check that `NEXT_PUBLIC_SOCKET_URL` is set correctly in Vercel
- Verify Railway/Render backend is running
- Check browser console for connection errors

### "404 on Socket.IO"
- Make sure Railway is using the `npm start` command
- Verify the Socket.IO server is listening on port 3000

### "CORS errors"
- Update the CORS settings in `/server/index.ts` if needed
- Add your Vercel domain to the allowed origins

---

## Cost

**Free Tier:**
- Vercel: Free for hobby projects
- Railway: $5 free credit (then ~$5-10/month)
- Render: Free tier available (spins down after inactivity)

**Recommended for production:** Vercel + Railway ($5-10/month total)

---

## Alternative: Deploy to Single Platform

If you prefer a simpler setup, deploy everything to:
- **Railway** (easiest, $5-10/month)
- **Render** (free tier available)
- **Fly.io** (good for low traffic)
- **DigitalOcean App Platform**

These platforms support WebSockets natively, so you don't need split deployment.
