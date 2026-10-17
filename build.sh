#!/usr/bin/env bash
# Exit on error
set -o errexit

echo "📦 1. Building React Frontend for Render..."
cd frontend
npm install
npm run build
cd ..

echo "🐍 2. Installing Python Backend Dependencies..."
python3 -m pip install -r requirements.txt || pip install -r requirements.txt

echo "✅ Build Complete!"
