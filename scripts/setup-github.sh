#!/usr/bin/env bash
# Initialize git repo and prepare for GitHub (Git Bash)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [ ! -d .git ]; then
  git init -b main
  git add .
  git commit -m "Initial Shiva platform scaffold"
  echo "Created local repo. Add remote:"
  echo "  git remote add origin https://github.com/YOUR_USER/shiva.git"
  echo "  git push -u origin main"
else
  echo "Git repo already exists."
fi
