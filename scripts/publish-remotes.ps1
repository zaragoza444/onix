# Publish Shiva to GitHub and Gitea
# Usage:
#   $env:GITHUB_TOKEN = "ghp_..."
#   $env:GITEA_TOKEN = "..."
#   powershell -ExecutionPolicy Bypass -File scripts/publish-remotes.ps1

$ErrorActionPreference = "Stop"
$RepoName = "shiva"
$GitHubUser = "zaragoza444"
$GiteaHost = "51.75.64.28"
$GiteaUser = "zaragoza444"

Set-Location (Split-Path -Parent $PSScriptRoot)

if (-not (Test-Path ".git")) {
  Write-Error "Run this from the shiva repo root (git init first)."
}

git branch -M main

if (-not (git remote | Select-String -Pattern "^github$" -Quiet)) {
  git remote add github "https://github.com/$GitHubUser/$RepoName.git"
}
if (-not (git remote | Select-String -Pattern "^gitea$" -Quiet)) {
  git remote add gitea "git@${GiteaHost}:${GiteaUser}/${RepoName}.git"
}

if ($env:GITHUB_TOKEN) {
  Write-Host "Creating GitHub repo if needed..."
  $headers = @{
    Authorization = "Bearer $env:GITHUB_TOKEN"
    Accept        = "application/vnd.github+json"
  }
  $body = @{
    name        = $RepoName
    private     = $false
    description = "Shiva production platform: Python, FastAPI, Next.js, API receiver/sender"
  } | ConvertTo-Json
  try {
    Invoke-RestMethod -Method Post -Uri "https://api.github.com/user/repos" -Headers $headers -Body $body -ContentType "application/json" | Out-Null
    Write-Host "GitHub repo created."
  } catch {
    Write-Host "GitHub repo create skipped (may already exist): $($_.Exception.Message)"
  }
  git remote set-url github "https://${GitHubUser}:$env:GITHUB_TOKEN@github.com/$GitHubUser/$RepoName.git"
}

if ($env:GITEA_TOKEN) {
  Write-Host "Creating Gitea repo if needed..."
  $headers = @{ Authorization = "token $env:GITEA_TOKEN" }
  $body = @{
    name        = $RepoName
    private     = $false
    description = "Shiva production platform: Python, FastAPI, Next.js, API receiver/sender"
  } | ConvertTo-Json
  try {
    Invoke-RestMethod -Method Post -Uri "http://${GiteaHost}/api/v1/user/repos" -Headers $headers -Body $body -ContentType "application/json" | Out-Null
    Write-Host "Gitea repo created."
  } catch {
    Write-Host "Gitea repo create skipped (may already exist): $($_.Exception.Message)"
  }
  git remote set-url gitea "http://${GiteaUser}:$env:GITEA_TOKEN@${GiteaHost}/${GiteaUser}/${RepoName}.git"
}

Write-Host "Pushing to GitHub..."
git push -u github main
if ($LASTEXITCODE -ne 0) {
  Write-Host "GitHub push failed. Sign in with: gh auth login"
  Write-Host "Or set `$env:GITHUB_TOKEN and re-run this script."
  exit 1
}

Write-Host "Pushing to Gitea..."
if ($env:GITEA_TOKEN) {
  git push -u gitea main
} else {
  $env:GIT_SSH_COMMAND = "ssh -i $env:USERPROFILE/.ssh/id_ed25519_gitea -o IdentitiesOnly=yes -o StrictHostKeyChecking=accept-new"
  git push -u gitea main
}
if ($LASTEXITCODE -ne 0) {
  Write-Host "Gitea push failed. Add your SSH public key in Gitea, or set `$env:GITEA_TOKEN and re-run."
  exit 1
}

Write-Host "Done."
Write-Host "GitHub: https://github.com/$GitHubUser/$RepoName"
Write-Host "Gitea:  http://${GiteaHost}/${GiteaUser}/${RepoName}"
