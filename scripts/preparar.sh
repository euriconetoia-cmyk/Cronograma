#!/usr/bin/env bash
# Prepara o ambiente (Linux, macOS ou Codespaces). Uso: bash scripts/preparar.sh
set -e
echo "==> Verificando Node.js"; node -v
corepack enable >/dev/null 2>&1 || npm install -g pnpm@10
[ -f .env ] || cp .env.example .env
cp .env packages/database/.env
echo "==> Subindo o PostgreSQL (Docker)"; docker compose up -d
until docker compose exec -T postgres pg_isready -U cronograma >/dev/null 2>&1; do sleep 1; done
echo "==> Instalando dependências"; pnpm install
echo "==> Gerando o Prisma Client"; pnpm db:generate
echo "==> Criando as tabelas"; pnpm db:deploy
echo
echo "Pronto! Agora rode:  pnpm dev"
echo "Em outro terminal:   pnpm dados:exemplo   (opcional)"
echo "Abra no navegador:   http://localhost:3000"
