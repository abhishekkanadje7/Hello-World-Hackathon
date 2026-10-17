#!/bin/bash

# ==============================================================================
# TriageX 2.0 - Predictive Customer Support Triage & Sentiment Router Launcher
# Smart India Hackathon / Hello World 2026
# ==============================================================================

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR"

echo "============================================================"
echo "🚀 Starting TriageX Full-Stack Platform..."
echo "============================================================"

# Kill any lingering instances on 8000 or 5173
lsof -ti:8000 | xargs kill -9 2>/dev/null || true
lsof -ti:5173 | xargs kill -9 2>/dev/null || true

# 1. Start Python FastAPI Backend
echo "🐍 Starting Python FastAPI Backend on http://127.0.0.1:8000..."
./venv/bin/uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload &
BACKEND_PID=$!

# Wait for backend to be ready
echo "⏳ Waiting for backend health check..."
sleep 2

# 2. Start React + Vite Frontend
echo "⚛️  Starting React Vite Frontend on http://localhost:5173..."
cd frontend
npm run dev -- --host 127.0.0.1 --port 5173 &
FRONTEND_PID=$!
cd ..

echo "============================================================"
echo "✅ TriageX 2.0 is LIVE and READY!"
echo "👉 Frontend App:  http://localhost:5173"
echo "👉 Backend API:   http://127.0.0.1:8000"
echo "👉 Swagger Docs:  http://127.0.0.1:8000/docs"
echo "👉 WebSocket URL: ws://127.0.0.1:8000/ws"
echo "============================================================"
echo "Press Ctrl+C to stop both servers."

# Trap SIGINT / SIGTERM to kill both servers cleanly
trap "echo 'Stopping TriageX servers...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" INT TERM

wait
