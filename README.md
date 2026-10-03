# Cronograma

Sistema web para planejamento acadêmico, criação de turmas e geração automática de cronogramas educacionais.

## Objetivo

Substituir progressivamente o planejamento baseado em planilhas por uma plataforma estruturada, auditável e configurável, capaz de gerar cronogramas automaticamente a partir de cursos, matrizes, calendários, modalidades, dias, horários e regras acadêmicas.

## Componentes principais

- Dashboard gerencial
- Cursos e matrizes curriculares
- Calendários acadêmicos
- Turmas
- Schedule Engine
- Validation Engine
- Editor visual de cronogramas
- Versionamento e aprovação
- Exportação
- Relatórios
- Auditoria
- Importação de planilhas
- IA assistiva em fases posteriores

## Documentação

A documentação oficial do projeto está em [docs/README.md](docs/README.md).

Documentos principais:

- [Produto e requisitos](docs/01-produto-e-requisitos.md)
- [Regras de negócio](docs/02-regras-negocio.md)
- [Arquitetura técnica](docs/03-arquitetura-tecnica.md)
- [Modelo de dados](docs/04-modelo-dados.md)
- [Schedule Engine](docs/05-schedule-engine.md)
- [Validation Engine](docs/06-validation-engine.md)
- [API e segurança](docs/07-api-e-seguranca.md)
- [UX e fluxos](docs/08-ux-e-fluxos.md)
- [Roadmap e backlog](docs/09-roadmap-e-backlog.md)
- [Testes e qualidade](docs/10-testes-e-qualidade.md)

## Regra arquitetural

Interface mostra.

API coordena.

Banco preserva.

Schedule Engine calcula.

Validation Engine verifica.

Export Engine apresenta.

Audit Service registra.

## Colaboração

Consulte [CONTRIBUTING.md](CONTRIBUTING.md) antes de iniciar alterações.

Novas funcionalidades devem ser desenvolvidas em branches próprias e submetidas por Pull Request.
