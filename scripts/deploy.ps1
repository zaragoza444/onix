# Deploy Onix to production
# Usage:
#   $env:VERCEL_TOKEN = "..."
#   $env:VERCEL_ORG_ID = "..."
#   $env:VERCEL_PROJECT_ID = "..."
#   $env:ONIX_API_URL = "https://your-api.onrender.com"
#   powershell -ExecutionPolicy Bypass -File scripts/deploy.ps1

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

Write-Host "==> Onix deploy"
Write-Host ""

if (-not $env:VERCEL_TOKEN) {
  Write-Host "Frontend (Vercel): skipped — set VERCEL_TOKEN"
  Write-Host "  1. https://vercel.com/account/tokens"
  Write-Host "  2. Import github.com/zaragoza444/onix with root directory 'frontend'"
  Write-Host "  3. Set NEXT_PUBLIC_API_URL to your API URL in Vercel env vars"
} else {
  Write-Host "Deploying frontend to Vercel..."
  Set-Location "$Root/frontend"
  if (-not (Test-Path node_modules)) { npm install }
  npx --yes vercel@latest deploy --prod --token $env:VERCEL_TOKEN @(
    if ($env:VERCEL_ORG_ID) { "--scope"; $env:VERCEL_ORG_ID }
  )
  Set-Location $Root
}

Write-Host ""
Write-Host "Backend (Render):"
Write-Host "  1. https://dashboard.render.com → New → Blueprint"
Write-Host "  2. Connect repo zaragoza444/onix (render.yaml at root)"
Write-Host "  3. Set CORS_ORIGINS to your Vercel URL after frontend deploys"
Write-Host ""
Write-Host "Backend (Railway alternative):"
Write-Host "  1. https://railway.app → Deploy from GitHub → root: backend"
Write-Host "  2. Add PostgreSQL plugin, set JWT_SECRET and CORS_ORIGINS"
Write-Host ""
Write-Host "GitHub Actions (automated): add repo secrets at"
Write-Host "  https://github.com/zaragoza444/onix/settings/secrets/actions"
Write-Host "  VERCEL_TOKEN, VERCEL_ORG_ID, VERCEL_PROJECT_ID, ONIX_API_URL"
Write-Host "  RENDER_DEPLOY_HOOK (optional, from Render service settings)"
Write-Host ""
Write-Host "Done."
