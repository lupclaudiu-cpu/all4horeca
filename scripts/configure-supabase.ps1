$ErrorActionPreference = "Stop"

$ProjectRef = "niavcqvhmeferakuerfs"
$ProjectUrl = "https://$ProjectRef.supabase.co"
$Workspace = Split-Path -Parent $PSScriptRoot
$SupabaseHome = Join-Path $Workspace ".supabase-home"
$NpmCache = Join-Path $Workspace ".npm-cache"

Set-Location -LiteralPath $Workspace
New-Item -ItemType Directory -Force -Path $SupabaseHome | Out-Null

$env:HOME = $SupabaseHome
$env:USERPROFILE = $SupabaseHome
$env:npm_config_cache = $NpmCache
Remove-Item Env:SUPABASE_ACCESS_TOKEN -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "1/4 Conectez proiectul Supabase..." -ForegroundColor Cyan
& npx.cmd supabase link --project-ref $ProjectRef
if ($LASTEXITCODE -ne 0) {
  throw "Conectarea proiectului Supabase a eșuat."
}

Write-Host ""
Write-Host "2/4 Aplic migrarea și datele demo..." -ForegroundColor Cyan
& npx.cmd supabase db push --include-seed
if ($LASTEXITCODE -ne 0) {
  throw "Migrarea bazei de date a eșuat."
}

Write-Host ""
Write-Host "3/4 Preiau cheia publică a proiectului..." -ForegroundColor Cyan
$keysOutput = & npx.cmd supabase projects api-keys --project-ref $ProjectRef --output json
if ($LASTEXITCODE -ne 0) {
  throw "Cheia publică nu a putut fi preluată."
}

$keys = $keysOutput | ConvertFrom-Json
$publicKeyRecord = $keys |
  Where-Object {
    $_.name -in @("anon", "publishable", "default") -or
    $_.type -eq "publishable"
  } |
  Select-Object -First 1

$publicKey = $publicKeyRecord.api_key
if (-not $publicKey) {
  $publicKey = $publicKeyRecord.key
}

if (-not $publicKey) {
  throw "Nu am identificat cheia publică în răspunsul Supabase."
}

Write-Host ""
Write-Host "4/4 Configurez aplicația Next.js..." -ForegroundColor Cyan
$envFile = Join-Path $Workspace ".env.local"
@"
NEXT_PUBLIC_SUPABASE_URL=$ProjectUrl
NEXT_PUBLIC_SUPABASE_ANON_KEY=$publicKey
"@ | Set-Content -LiteralPath $envFile -Encoding utf8

Write-Host ""
Write-Host "Supabase este configurat cu succes." -ForegroundColor Green
Write-Host "Repornește serverul Next.js cu:" -ForegroundColor Yellow
Write-Host "npm.cmd run dev -- --hostname 0.0.0.0"
