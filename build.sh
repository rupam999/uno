#!/bin/bash
set -e

echo "Installing dependencies..."
npm ci --prefer-offline --no-audit --loglevel=error || npm install --loglevel=error

echo "Building Next.js application..."
npm run build:frontend

echo "Build completed successfully!"
