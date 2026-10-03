# Documentação do Projeto Cronograma

Este diretório concentra a documentação oficial do sistema de planejamento acadêmico e geração de cronogramas.

## Índice

1. [Produto e requisitos](01-produto-e-requisitos.md)
2. [Regras de negócio](02-regras-negocio.md)
3. [Arquitetura técnica](03-arquitetura-tecnica.md)
4. [Modelo de dados](04-modelo-dados.md)
5. [Schedule Engine](05-schedule-engine.md)
6. [Validation Engine](06-validation-engine.md)
7. [API e segurança](07-api-e-seguranca.md)
8. [UX e fluxos](08-ux-e-fluxos.md)
9. [Roadmap e backlog](09-roadmap-e-backlog.md)
10. [Testes e qualidade](10-testes-e-qualidade.md)
11. [Ambiente de desenvolvimento](11-ambiente-desenvolvimento.md)
12. [API do Catálogo Acadêmico](12-api-catalogo-academico.md)
13. [Calendário Acadêmico](13-calendario-academico.md)
14. [Turmas e Regras](14-turmas-e-regras.md)
15. [Schedule Engine: Geração Completa](15-schedule-engine-geracao.md)
16. [Validation Engine e Editor](16-validation-editor.md)
17. [Versionamento, Auditoria e Aprovação](17-versionamento-aprovacao.md)
18. [Recursos e Conflitos Operacionais](18-recursos-conflitos.md)
19. [Dashboard e Relatórios](19-dashboard-relatorios.md)

## Princípios do projeto

O sistema deve ser modular, auditável, configurável e preparado para diferentes tipos de cursos e modelos de cronograma.

A interface não deve conter regras acadêmicas críticas.

O Schedule Engine deve ser determinístico e independente da interface.

O Validation Engine deve ser responsável por identificar erros, alertas e informações.

As planilhas existentes são referências de negócio e não devem limitar o modelo de dados.
