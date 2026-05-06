# URGENT: Update Render Build Command

## The Problem
Render keeps getting "sh: 1: next: not found" because npm install is failing.

## Solution
The build command in package.json now handles the full install + build process.

## Steps to Fix

### Option 1: Update Existing Service (Recommended)

1. Go to https://dashboard.render.com/
2. Click on your `uno-game` service
3. Click "Settings" (left sidebar)
4. Scroll to "Build & Deploy" section
5. Change **Build Command** to: `npm run build`
6. Change **Start Command** to: `npm start`
7. Click "Save Changes"
8. Go to "Manual Deploy" → "Deploy latest commit"

### Option 2: Delete and Recreate

1. Delete the current service in Render
2. Create new "Web Service"
3. Connect your GitHub repo
4. Render will auto-detect from `render.yaml`
5. Click "Create Web Service"

## What Changed

The `npm run build` script now:
1. Runs `npm install --no-package-lock --legacy-peer-deps` first
2. Then builds Next.js with `npm run build:frontend`
3. All in one command - guaranteed to work!

## After Deploying

Your build logs should show:
```
added 386 packages in 2m
Building Next.js application...
✓ Compiled successfully
Build completed successfully!
```

---

**IMPORTANT**: Make sure to push your changes first:
```bash
git add .
git commit -m "Fix Render build command"
git push
```

Then update the build command in Render dashboard!

