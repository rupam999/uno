# Deploy to Render

## Quick Setup

1. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push
   ```

2. **Deploy to Render**:
   - Go to https://render.com/
   - Click "New +" → "Web Service"
   - Connect your GitHub repo
   - Render will auto-detect settings from `render.yaml`
   - Click "Create Web Service"

## Manual Configuration (if needed)

If auto-detection doesn't work:
- **Build Command**: `bash build.sh`
- **Start Command**: `npm start`
- **Environment**: Node

## That's it! 🎉

Your game will be live at: `https://your-service-name.onrender.com`

## Important Notes

- ✅ Build script handles npm install issues automatically
- ✅ WebSocket support is built-in
- ⚠️ Free tier: service sleeps after 15min inactivity (30s wake-up)
- 🎮 Ready for 2-10 players per room

## Troubleshooting

If build fails, check Render logs. The build script has fallback logic for common npm issues.
