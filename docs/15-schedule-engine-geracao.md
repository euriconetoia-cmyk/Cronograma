# Schedule Engine: Primeira Geração Completa

## Objetivo

Gerar automaticamente um cronograma a partir de uma turma cadastrada, utilizando matriz curricular, funcionamento semanal, calendário acadêmico e regras da turma.

## Entrada

O motor recebe:

- data inicial;
- data limite opcional;
- módulos;
- Unidades Curriculares;
- carga horária de cada UC;
- quantidade de encontros;
- dias da semana;
- horários;
- carga máxima diária;
- restrições do calendário;
- recuperação;
- prazo adicional do AVA.

## Algoritmo atual

1. Ordenar módulos.
2. Ordenar UCs dentro de cada módulo.
3. Localizar o primeiro dia acadêmico válido.
4. Calcular a capacidade diária a partir do horário da turma.
5. Distribuir a carga horária da UC nos dias disponíveis.
6. Ignorar datas bloqueadas.
7. Determinar início e término da UC.
8. Gerar os encontros configurados.
9. Calcular o encerramento do AVA.
10. Gerar recuperação quando habilitada.
11. Iniciar a próxima UC.
12. Comparar o término calculado com a data limite.

## Capacidade diária

A capacidade diária é calculada usando:

```text
horário final - horário inicial
```

Quando existir `maxDailyHours`, o menor valor entre a duração do horário e o limite diário será utilizado.

## Calendário

O motor usa `isAcademicDay` para verificar:

- dia permitido da semana;
- feriados;
- recessos;
- férias;
- bloqueios;
- qualquer outro evento com `blocksAcademicActivities=true`.

## AVA

O encerramento do AVA é calculado com:

```text
término da UC + dias extras da UC + dias extras da turma
```

Nesta versão, esses dias são dias corridos.

## Recuperação

Quando:

- a turma habilita recuperação; e
- a UC possui `recoveryEnabled=true`;

é criado um item de recuperação.

Nesta primeira versão, a recuperação utiliza um dia acadêmico padrão.

O motor retorna um alerta explícito informando essa limitação.

A duração configurável da recuperação será implementada em evolução posterior.

## Encontros

A quantidade de encontros vem da UC.

Os encontros utilizam datas acadêmicas já alocadas para a UC e os horários configurados para o respectivo dia.

Tipos suportados inicialmente:

- PRESENCIAL;
- WEB_CLASS.

## Saída

A geração retorna:

- data inicial;
- data final;
- UCs;
- recuperações;
- datas das UCs;
- término do AVA;
- encontros;
- alertas.

## Persistência

O resultado oficial é armazenado nas entidades:

- Schedule;
- ScheduleItem;
- Meeting.

## API

### Prévia sem persistência

```text
GET /api/schedules/class/:classGroupId/preview
```

### Gerar e salvar

```text
POST /api/schedules/class/:classGroupId/generate
```

### Consultar cronograma salvo

```text
GET /api/schedules/class/:classGroupId
```

## Interface

A prévia está disponível em:

```text
/turmas/{id}/cronograma
```

O usuário pode recalcular a prévia antes de salvar.

## Testes implementados

- distribuição em segunda, quarta e sexta;
- bloqueio por feriado;
- recuperação;
- prazo adicional do AVA;
- data limite ultrapassada.

## Limitações conhecidas desta versão

1. Recuperação ainda possui duração padrão de um dia acadêmico.
2. Matrícula e aula inaugural ainda não são geradas pelo motor.
3. Os encontros são posicionados dentro dos dias já alocados para a UC.
4. Não há ainda detecção de conflito de instrutor ou sala.
5. Não há ainda versionamento do cronograma salvo.
6. O editor manual será implementado posteriormente.

Essas limitações são deliberadas para manter o motor determinístico e incremental.
