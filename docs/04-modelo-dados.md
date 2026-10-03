# Modelo de Dados

## Entidades principais

### User
Usuário autenticado.

### Role
Perfil de acesso.

### Permission
Permissão granular.

### Unit
Unidade educacional.

### Course
Curso.

### CourseVersion
Versão da matriz de um curso.

### CourseModule
Módulo curricular.

### CurricularUnit
Unidade Curricular.

### Modality
Modalidade configurável.

### AcademicCalendar
Calendário por unidade e ano.

### CalendarEvent
Feriado, recesso, bloqueio ou outro evento.

### ClassGroup
Turma.

### ClassScheduleRule
Dias, horários e limites da turma.

### Schedule
Cronograma lógico da turma.

### ScheduleVersion
Versão imutável ou historizada de um cronograma.

### ScheduleItem
Item acadêmico gerado, como UC, recuperação ou matrícula.

### Meeting
Encontro com data e horário.

### Person
Pessoa vinculada ao processo acadêmico.

### InstructorAvailability
Disponibilidade de instrutor.

### Room
Sala ou laboratório.

### Approval
Fluxo de aprovação.

### AuditLog
Registro de alterações.

## Relacionamentos

Course 1:N CourseVersion

CourseVersion 1:N CourseModule

CourseModule 1:N CurricularUnit

ClassGroup N:1 CourseVersion

ClassGroup N:1 Unit

ClassGroup N:1 AcademicCalendar

ClassGroup 1:1 Schedule

Schedule 1:N ScheduleVersion

ScheduleVersion 1:N ScheduleItem

ScheduleItem 1:N Meeting

Meeting N:1 Person

Meeting N:1 Room

## Diretrizes

Usar chaves estrangeiras e restrições de integridade.

Usar transações para operações que alterem várias entidades.

JSON deve ficar restrito a snapshots, configurações complementares e metadados quando apropriado.

## Versionamento

Cronogramas aprovados devem permanecer reproduzíveis.

Cada versão deve registrar:

- número;
- autor;
- data;
- motivo;
- resumo das alterações;
- estado completo necessário para reprodução.
