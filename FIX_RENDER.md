# URGENT: Update Render Build Command

## The Problem
Render is using the old build command: `npm install && npm run build`

This needs to be changed to: `bash build.sh`

## How to Fix (Choose ONE method)

### Method 1: Update in Render Dashboard (RECOMMENDED)

1. Go to https://dashboard.render.com/
2. Click on your `uno-game` service
3. Click "Settings" (left sidebar)
4. Scroll down to "Build & Deploy"
5. Find "Build Command"
6. Change from: `npm install && npm run build`
7. Change to: `bash build.sh`
8. Click "Save Changes"
9. Click "Manual Deploy" → "Deploy latest commit"

### Method 2: Delete and Recreate Service

1. Delete the current Render service
2. Create new service
3. Let Render auto-detect from `render.yaml`

## Why This Fixes the Issue

The `build.sh` script:
- Has multiple fallback strategies for npm install
- Handles the "Exit handler never called" error
- Uses progressive installation methods
- Works around Render's npm issues

## After Updating

Your build will:
1. Try `npm ci` (fastest)
2. Fall back to `npm install --no-package-lock`
3. Fall back to `npm install --legacy-peer-deps`
4. Finally try `npm install --force` as last resort
5. Build Next.js successfully

---

**DO THIS NOW**: Update the build command in Render dashboard before deploying again!
