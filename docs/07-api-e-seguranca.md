# API e Segurança

## API

Recursos principais:

- auth
- users
- roles
- permissions
- units
- courses
- course-versions
- curricular-units
- modalities
- calendars
- calendar-events
- classes
- schedules
- schedule-versions
- schedule-items
- meetings
- people
- rooms
- approvals
- reports
- audit

## Endpoints conceituais

```text
POST /auth/login

GET  /courses
POST /courses

POST /course-versions

GET  /calendars
POST /calendars

POST /classes
POST /classes/:id/simulate
POST /classes/:id/generate-schedule

GET  /schedules/:id
POST /schedules/:id/validate
POST /schedules/:id/recalculate
POST /schedules/:id/submit
POST /schedules/:id/approve
POST /schedules/:id/export
```

## Segurança

Requisitos mínimos:

- senha com hash seguro;
- sessões protegidas;
- RBAC;
- autorização no backend;
- validação de entrada;
- proteção de rotas;
- rate limiting em autenticação;
- logs de erro;
- logs de auditoria;
- proteção contra operações não autorizadas.

## Auditoria

Registrar pelo menos:

- criação e alteração de curso;
- alteração de matriz;
- criação de turma;
- geração de cronograma;
- edição de cronograma;
- aprovação;
- publicação;
- exclusão;
- exportação.

Cada registro deverá identificar usuário, data, ação, entidade e mudanças.
