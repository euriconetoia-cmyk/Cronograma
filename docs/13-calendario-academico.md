# Calendário Acadêmico

## Objetivo

Manter calendários por unidade e ano e transformar seus eventos em restrições consumíveis pelo Schedule Engine.

## Entidades

### AcademicCalendar

- nome;
- ano;
- unidade;
- status;
- eventos.

Existe no máximo um calendário por unidade e ano.

### CalendarEvent

Tipos:

- NATIONAL_HOLIDAY;
- STATE_HOLIDAY;
- MUNICIPAL_HOLIDAY;
- RECESS;
- VACATION;
- ACADEMIC_DAY;
- NON_ACADEMIC_DAY;
- BLOCKED_DATE;
- INSTITUTIONAL_EVENT.

Cada evento possui início, término e a propriedade `blocksAcademicActivities`.

O tipo do evento não determina sozinho se haverá bloqueio.

## Regras

1. O evento deve permanecer dentro do ano do calendário.
2. A data final não pode ser anterior à inicial.
3. Períodos com múltiplos dias são permitidos.
4. Eventos institucionais podem ser apenas informativos.
5. O Schedule Engine recebe restrições independentes do modelo do banco.

## API

```text
GET    /api/calendars
POST   /api/calendars
POST   /api/calendars/events
DELETE /api/calendars/events/:id
GET    /api/calendars/:id/restrictions
```

## Contrato de restrição

```json
{
  "startDate": "2027-04-01",
  "endDate": "2027-04-05",
  "blocksAcademicActivities": true,
  "reason": "Recesso",
  "type": "RECESS"
}
```

Esse contrato é compatível com o Schedule Engine e evita acoplamento direto entre motor e Prisma.
