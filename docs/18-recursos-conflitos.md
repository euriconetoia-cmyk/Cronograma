# Gestão de Recursos e Conflitos Operacionais

## Objetivo

Controlar os recursos necessários aos encontros e detectar automaticamente indisponibilidades e sobreposições antes da aprovação do cronograma.

## Recursos físicos

Entidade `Room`.

Tipos iniciais:

- CLASSROOM;
- COMPUTER_LAB;
- NETWORK_LAB;
- ELECTRICAL_LAB;
- WORKSHOP;
- OTHER.

Cada recurso possui:

- nome;
- código;
- tipo;
- capacidade;
- unidade;
- status.

O código é único dentro de cada unidade.

## Disponibilidade de pessoas

A disponibilidade é cadastrada por:

- pessoa;
- dia da semana;
- horário inicial;
- horário final.

Uma pessoa pode ter várias janelas de disponibilidade.

O horário final deve ser posterior ao inicial.

## Recursos dos encontros

Cada `Meeting` pode possuir:

- instrutor;
- sala ou laboratório.

A sala selecionada deve pertencer à mesma unidade da turma.

## Conflitos detectados

### INSTRUCTOR_CONFLICT

O mesmo instrutor aparece em encontros com horários sobrepostos na mesma data.

Severidade: ERROR.

### ROOM_CONFLICT

A mesma sala ou laboratório aparece em encontros simultâneos.

Severidade: ERROR.

### INSTRUCTOR_OUTSIDE_AVAILABILITY

O encontro está fora das janelas cadastradas para o instrutor.

Severidade: ERROR.

### ROOM_CAPACITY_INSUFFICIENT

A capacidade da sala é menor que a quantidade prevista de alunos da turma.

Severidade: ERROR.

### INSTRUCTOR_NOT_ASSIGNED

Encontro sem instrutor.

Severidade: WARNING.

### ROOM_NOT_ASSIGNED

Encontro sem sala ou laboratório.

Severidade: WARNING.

## Governança

Conflitos de severidade ERROR impedem:

- envio para aprovação;
- aprovação do cronograma.

Avisos de recurso ainda não atribuído não bloqueiam o workflow nesta fase.

## API de recursos

```text
GET  /api/rooms
POST /api/rooms

GET  /api/people/:id/availability
POST /api/people/:id/availability
```

## API dos encontros

```text
PATCH /api/schedules/meetings/:id/resources
GET   /api/schedules/class/:classGroupId/resource-conflicts
```

## Interface

Cadastro geral:

```text
/recursos
```

Alocação por turma:

```text
/turmas/{id}/cronograma/recursos
```

A tela de alocação mostra todos os encontros do cronograma, permite definir instrutor e sala e recalcula os conflitos após cada alteração.

## Próximas evoluções

- indisponibilidade por data específica;
- férias e afastamentos de profissionais;
- equipamentos obrigatórios por UC;
- sugestão automática de recurso disponível;
- carga horária acumulada por instrutor;
- ocupação de salas em visão semanal.
