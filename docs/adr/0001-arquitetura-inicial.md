# ADR 0001: Arquitetura inicial

## Status

Proposta inicial aceita para início do desenvolvimento.

## Contexto

O sistema precisa combinar interface administrativa, regras acadêmicas complexas, cálculos determinísticos de datas, validação de conflitos, auditoria, exportação e possibilidade de evolução para novos modelos de cronograma.

## Decisão

Adotar arquitetura modular em monorepositório.

Stack inicial:

- TypeScript em toda a aplicação;
- Next.js no frontend;
- NestJS no backend;
- PostgreSQL como banco relacional;
- Prisma como camada de acesso e migrations;
- pacotes independentes para Schedule Engine e Validation Engine.

## Motivos

- compartilhamento de tipos;
- separação clara de responsabilidades;
- facilidade de testes;
- possibilidade de evolução dos motores sem acoplamento visual;
- manutenção de regras de negócio centralizadas.

## Consequências

Mudanças importantes de arquitetura deverão gerar novos ADRs.

Nenhuma regra acadêmica crítica deverá ser implementada exclusivamente em componentes do frontend.
