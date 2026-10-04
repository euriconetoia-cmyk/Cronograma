# Arquitetura Técnica

## Princípio

Separar claramente apresentação, regras de negócio, persistência, autenticação, geração de cronogramas, validação e exportação.

## Stack sugerida

### Frontend

- TypeScript
- React
- Next.js

### Backend

- TypeScript
- NestJS

### Banco

- PostgreSQL

### ORM

- Prisma

### Testes

- Vitest ou Jest para unitários
- Supertest para integração
- Playwright para end to end

## Estrutura de monorepositório

```text
apps/
  web/
  api/

packages/
  schedule-engine/
  validation-engine/
  database/
  shared/
  config/
  ui/
  export/
  import/
  testing/
```

## Responsabilidades

### apps/web

Interface administrativa.

### apps/api

API, autenticação, autorização, orquestração e acesso aos serviços.

### schedule-engine

Cálculo de cronogramas.

### validation-engine

Validação de regras e conflitos.

### database

Schema, migrations, seeds e repositórios.

### export

Excel, PDF e CSV.

### import

Leitura e mapeamento de planilhas.

## Regras arquiteturais

1. Componentes visuais não devem calcular datas acadêmicas.
2. O Schedule Engine não deve depender do frontend.
3. Regras configuráveis não devem ficar espalhadas no código.
4. Toda operação crítica deve ser validada no backend.
5. Mudanças importantes devem gerar auditoria.
6. Dados relacionais essenciais não devem ser armazenados apenas como JSON.
7. Toda migration deve ser versionada no Git.
