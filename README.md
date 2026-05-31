# Onix Platform

Production-ready scaffold: **Python 3**, **Docker**, **Node.js (Next.js)**, **GitHub**, **GitHub Codespaces**, **Vercel**, **Visual Studio Code**, **Cursor**, and **Git Bash**.

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│   Vercel    │────▶│  Next.js UI  │────▶│  FastAPI (Py3)  │
│  (frontend) │     │  frontend/   │     │  backend/       │
└─────────────┘     └──────────────┘     └─────────────────┘
       │                    │                      │
       └────────────────────┴──────────────────────┘
                    GitHub · Codespaces · Docker
```

| Tool | Role |
|------|------|
| **Python 3.12** | REST API (`backend/`) |
| **Node.js 20** | Web app (`frontend/`) |
| **Docker** | Local + production containers |
| **Vercel** | Host frontend (`frontend/`) |
| **GitHub** | Source control + Actions CI |
| **Codespaces** | Cloud dev via `.devcontainer/` |
| **VS Code / Cursor** | Local IDE (`.vscode/`, `.cursor/`) |
| **Git Bash** | Scripts in `scripts/*.sh` |

## Quick start (Windows + Git Bash)

```bash
cd onix
cp .env.example backend/.env
cp .env.example frontend/.env.local

# Option A — Docker (recommended)
docker compose up --build

# Option B — Without Docker
cd backend && python -m venv .venv && source .venv/Scripts/activate
pip install -r requirements.txt && uvicorn app.main:app --reload --port 8000

# New terminal
cd frontend && npm install && npm run dev
```

- Web: http://localhost:3000  
- API: http://localhost:8000/api/docs  

Or run: `bash scripts/dev.sh`

## Visual Studio Code / Cursor

1. Open the project folder
2. Install recommended extensions (prompt on open)
3. Use **Run and Debug** or integrated terminal with the commands above

Cursor picks up rules from `.cursor/rules/onix-platform.mdc`.

## GitHub Codespaces

1. Push repo to GitHub
2. **Code → Codespaces → Create codespace**
3. Ports 3000 and 8000 forward automatically

## API Receiver & Sender (production)

| Endpoint | Auth | Description |
|----------|------|-------------|
| `GET /api/v1/receiver/config` | JWT | Your webhook URLs & keys |
| `POST /api/v1/receiver/ingest` | JWT | Receive JSON from your apps |
| `POST /api/v1/receiver/hook/{receiver_key}` | Webhook secret header | Public inbound webhook |
| `GET /api/v1/receiver/messages` | JWT | List received payloads |
| `POST /api/v1/sender/dispatch` | JWT | Send HTTP to external URLs |
| `GET /api/v1/sender/messages` | JWT | List outbound requests |

Set `API_ENVIRONMENT=production` in backend `.env`. Manage receiver/sender from the **Dashboard → API Hub** UI.

## Auth & database

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/auth/register` | POST | Create account (email, password) |
| `/api/v1/auth/login` | POST | Get JWT |
| `/api/v1/auth/me` | GET | Current user (Bearer token) |

- **Local Docker**: PostgreSQL via `docker compose` (`DATABASE_URL` set automatically)
- **Local without Docker**: SQLite default (`sqlite:///./onix.db`)

Frontend pages: `/register`, `/login`, `/dashboard`

## Deploy API (Railway or Render)

**Railway** — set root to `backend/`, add PostgreSQL plugin, set `JWT_SECRET` and `CORS_ORIGINS` (your Vercel URL). See `railway.toml`.

**Render** — use `render.yaml` blueprint (API + managed Postgres).

After deploy, copy the API URL (e.g. `https://onix-api.onrender.com`).

## Deploy frontend (Vercel)

1. Import `frontend/` as a Vercel project
2. Set `NEXT_PUBLIC_API_URL` = your deployed API URL
3. Add the Vercel URL to API `CORS_ORIGINS`
4. Deploy

Remove `@onix_api_url` from `vercel.json` if you configure env vars only in the Vercel dashboard.

## Deploy (production)

### 1. Backend — Render (recommended)

1. Open https://dashboard.render.com → **New → Blueprint**
2. Connect **github.com/zaragoza444/onix** (uses `render.yaml`)
3. After deploy, copy the API URL (e.g. `https://onix-api.onrender.com`)
4. In Render service env, set `CORS_ORIGINS` to your Vercel frontend URL

### 2. Frontend — Vercel

1. Open https://vercel.com/new → Import **zaragoza444/onix**
2. Set **Root Directory** to `frontend`
3. Add env var: `NEXT_PUBLIC_API_URL` = your Render/Railway API URL
4. Deploy

### 3. CLI / automation

```powershell
# Optional tokens — then:
powershell -ExecutionPolicy Bypass -File scripts/deploy.ps1
```

GitHub Actions auto-deploy on push to `main` when these secrets are set:
`VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`, `ONIX_API_URL`, `RENDER_DEPLOY_HOOK`

## Repository

| Host | URL | Status |
|------|-----|--------|
| **GitHub** | https://github.com/zaragoza444/onix | Live on `main` |
| **Gitea** | http://51.75.64.28/zaragoza444/onix | Push after SSH key + empty repo |

### Publish to both remotes

```powershell
$env:GITHUB_TOKEN = "ghp_..."   # optional if Git Credential Manager is set up
$env:GITEA_TOKEN = "..."        # or use SSH key id_ed25519_gitea
powershell -ExecutionPolicy Bypass -File scripts/publish-remotes.ps1
```

**Gitea SSH (one-time):** add `~/.ssh/id_ed25519_gitea.pub` in Gitea → SSH Keys, create empty repo `onix`, then `git push -u gitea main`.

CI runs on push: Python check, Next.js build, Docker build (`.github/workflows/ci.yml`).

## Project layout

```
onix/
├── backend/          # FastAPI + Python 3
├── frontend/         # Next.js → Vercel
├── scripts/          # Git Bash helpers
├── .devcontainer/    # Codespaces
├── .github/workflows/  # CI
├── .vscode/          # VS Code
├── .cursor/          # Cursor rules
└── docker-compose.yml
```

## API endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/v1/info` | Platform metadata |
| POST | `/api/v1/auth/register` | Register |
| POST | `/api/v1/auth/login` | Login |
| GET | `/api/v1/auth/me` | Profile (auth required) |
| GET | `/api/docs` | Swagger UI |

## License

MIT — customize for your organization.
