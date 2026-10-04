# Prepara o ambiente no Windows. Uso (PowerShell, na pasta do projeto):
#   powershell -ExecutionPolicy Bypass -File scripts\preparar.ps1
$ErrorActionPreference = "Stop"
Write-Host "==> Verificando Node.js"; node -v
try { corepack enable } catch { npm install -g pnpm@10 }
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
Copy-Item .env packages\database\.env -Force
Write-Host "==> Subindo o PostgreSQL (Docker Desktop precisa estar aberto)"
docker compose up -d
do { Start-Sleep 1; docker compose exec -T postgres pg_isready -U cronograma *> $null } until ($LASTEXITCODE -eq 0)
Write-Host "==> Instalando dependencias"; pnpm install
Write-Host "==> Gerando o Prisma Client"; pnpm db:generate
Write-Host "==> Criando as tabelas"; pnpm db:deploy
Write-Host ""
Write-Host "Pronto! Agora rode:  pnpm dev"
Write-Host "Em outro terminal:   pnpm dados:exemplo   (opcional)"
Write-Host "Abra no navegador:   http://localhost:3000"
