$ErrorActionPreference = "Stop"

$Workspace = Split-Path -Parent $PSScriptRoot
$NetlifyHome = Join-Path $Workspace ".netlify-home"
$NpmCache = Join-Path $Workspace ".npm-cache"

Set-Location -LiteralPath $Workspace

$env:HOME = $NetlifyHome
$env:USERPROFILE = $NetlifyHome
$env:APPDATA = Join-Path $NetlifyHome "AppData\Roaming"
$env:LOCALAPPDATA = Join-Path $NetlifyHome "AppData\Local"
$env:npm_config_cache = $NpmCache

New-Item -ItemType Directory -Force -Path $env:APPDATA, $env:LOCALAPPDATA | Out-Null

& npx.cmd netlify login
