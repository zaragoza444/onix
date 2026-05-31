# Start Docker Desktop (Windows) and run Onix stack
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

function Test-DockerReady {
  $prev = $ErrorActionPreference
  $ErrorActionPreference = "SilentlyContinue"
  docker info *> $null
  $ok = $LASTEXITCODE -eq 0
  $ErrorActionPreference = $prev
  return $ok
}

if (-not (Test-DockerReady)) {
  Write-Host "Docker is not running. Starting Docker Desktop..."
  $candidates = @(
    "${env:ProgramFiles}\Docker\Docker\Docker Desktop.exe",
    "${env:ProgramFiles(x86)}\Docker\Docker\Docker Desktop.exe"
  )
  $dockerDesktop = $candidates | Where-Object { Test-Path $_ } | Select-Object -First 1
  if ($dockerDesktop) {
    Start-Process $dockerDesktop | Out-Null
    $deadline = (Get-Date).AddMinutes(3)
    while ((Get-Date) -lt $deadline) {
      Start-Sleep -Seconds 5
      if (Test-DockerReady) {
        Write-Host "Docker is ready."
        break
      }
      Write-Host "Waiting for Docker..."
    }
  } else {
    Write-Error "Docker Desktop not found. Install from https://www.docker.com/products/docker-desktop/"
  }
}

if (-not (Test-DockerReady)) {
  Write-Error "Docker daemon still not available. Open Docker Desktop manually, wait until it says Running, then run: docker compose up --build"
}

Write-Host "Building and starting Onix (db + api + web)..."
docker compose up --build
