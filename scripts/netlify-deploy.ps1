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

$envFile = Join-Path $Workspace ".env.local"
if (-not (Test-Path -LiteralPath $envFile)) {
  throw ".env.local lipsește. Configurează mai întâi Supabase."
}

$envLines = Get-Content -LiteralPath $envFile
$supabaseUrl = ($envLines | Where-Object { $_ -like "NEXT_PUBLIC_SUPABASE_URL=*" }) -replace "^NEXT_PUBLIC_SUPABASE_URL=", ""
$supabaseKey = ($envLines | Where-Object { $_ -like "NEXT_PUBLIC_SUPABASE_ANON_KEY=*" }) -replace "^NEXT_PUBLIC_SUPABASE_ANON_KEY=", ""

if (-not $supabaseUrl -or -not $supabaseKey) {
  throw "Variabilele Supabase nu sunt complete în .env.local."
}

$linked = Test-Path -LiteralPath (Join-Path $Workspace ".netlify\state.json")
if (-not $linked) {
  $siteName = "all4horeca-" + (Get-Random -Minimum 1000 -Maximum 9999)
  Write-Host "Creez site-ul Netlify $siteName..." -ForegroundColor Cyan
  & npx.cmd netlify sites:create --name $siteName
  if ($LASTEXITCODE -ne 0) {
    throw "Site-ul Netlify nu a putut fi creat."
  }
  Write-Host "Configurez variabilele Supabase..." -ForegroundColor Cyan
  & npx.cmd netlify env:set NEXT_PUBLIC_SUPABASE_URL $supabaseUrl
  if ($LASTEXITCODE -ne 0) { throw "NEXT_PUBLIC_SUPABASE_URL nu a putut fi setat." }
  & npx.cmd netlify env:set NEXT_PUBLIC_SUPABASE_ANON_KEY $supabaseKey
  if ($LASTEXITCODE -ne 0) { throw "NEXT_PUBLIC_SUPABASE_ANON_KEY nu a putut fi setat." }
}

Write-Host "Public aplicația..." -ForegroundColor Cyan
& npx.cmd netlify deploy --prod --build
if ($LASTEXITCODE -ne 0) {
  throw "Deploy-ul Netlify a eșuat."
}
