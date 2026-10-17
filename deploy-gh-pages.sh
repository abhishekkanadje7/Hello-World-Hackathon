#!/bin/bash
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR"

export PATH="/Users/abhishekkanadje7/.nvm/versions/node/v24.19.0/bin:$PATH:/usr/local/bin:/opt/homebrew/bin"

echo "🔨 1. Building Frontend for GitHub Pages..."
cd frontend
npm run build
touch dist/.nojekyll
cd ..

echo "📦 2. Deploying dist to gh-pages branch..."
TEMP_DEPLOY_DIR=$(mktemp -d)
cp -r frontend/dist/* "$TEMP_DEPLOY_DIR/"

cd "$TEMP_DEPLOY_DIR"
git init
git checkout -b gh-pages
git config user.name "ABHISHEK KANADJE"
git config user.email "abhishekkanadje7@gmail.com"
git add .
git commit -m "Deploy TriageX 2.1 to GitHub Pages"
git remote add origin https://github.com/abhishekkanadje7/Hello-World-Hackathon.git

echo "🚀 3. Pushing to GitHub gh-pages..."
env -u HTTP_PROXY -u HTTPS_PROXY -u http_proxy -u https_proxy git push -f origin gh-pages

cd "$DIR"
rm -rf "$TEMP_DEPLOY_DIR"

echo "============================================================"
echo "✅ SUCCESS! Deployed to branch 'gh-pages' on GitHub."
echo "👉 GitHub Repo: https://github.com/abhishekkanadje7/Hello-World-Hackathon"
echo "👉 GitHub Pages: https://abhishekkanadje7.github.io/Hello-World-Hackathon/"
echo "============================================================"
