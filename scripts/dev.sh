#!/usr/bin/env bash
# Shiva local dev — Git Bash / WSL / macOS / Linux
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "==> Shiva: starting API + web"
cd "$ROOT"

if ! command -v docker &>/dev/null; then
  echo "Docker not found. Starting processes without Docker..."
  (cd backend && pip install -r requirements.txt && uvicorn app.main:app --reload --port 8000) &
  (cd frontend && npm install && npm run dev) &
  wait
else
  docker compose up --build
fi
