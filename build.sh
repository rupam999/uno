#!/bin/bash
set -e

echo "Installing dependencies..."

# Try multiple installation methods
if npm ci --prefer-offline --no-audit --loglevel=error 2>/dev/null; then
    echo "npm ci succeeded"
elif npm install --no-package-lock --loglevel=error 2>/dev/null; then
    echo "npm install (no lock) succeeded"
elif npm install --legacy-peer-deps --loglevel=error 2>/dev/null; then
    echo "npm install (legacy) succeeded"
else
    echo "Trying final fallback..."
    rm -rf node_modules
    npm install --force --loglevel=error
fi

echo "Building Next.js application..."
npm run build:frontend

echo "Build completed successfully!"
