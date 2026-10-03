# Ambiente de Desenvolvimento

## Requisitos

- Node.js 22
- pnpm 10
- Docker com Docker Compose

## Preparação

```bash
cp .env.example .env
docker compose up -d
pnpm install
pnpm db:generate
```

## Desenvolvimento

```bash
pnpm dev
```

Frontend: http://localhost:3000

API: http://localhost:3001

Health check:

```text
GET http://localhost:3001/health
```

## Testes

```bash
pnpm test
```

## Verificação de tipos

```bash
pnpm typecheck
```

## Banco

Gerar cliente:

```bash
pnpm db:generate
```

Criar migration:

```bash
pnpm db:migrate
```

## Estado atual

A Fase 0 entrega a fundação técnica e os primeiros contratos executáveis dos motores. A modelagem completa de domínio será implementada incrementalmente nas próximas fases.
