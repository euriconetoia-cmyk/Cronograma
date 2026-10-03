# Dashboard, Planejamento Anual e Relatórios

## Objetivo

Transformar os dados operacionais do sistema em informações gerenciais para planejamento, acompanhamento e tomada de decisão.

## Dashboard

Rota:

```text
/dashboard
```

Indicadores atuais:

- total de turmas;
- cursos ativos;
- carga horária planejada;
- cronogramas;
- encontros;
- pessoas;
- salas e laboratórios;
- conflitos;
- conflitos críticos.

Distribuições:

- turmas por status;
- turmas por modalidade;
- turmas por unidade;
- cronogramas por status.

## Planejamento anual

Rota:

```text
/planejamento-anual
```

A visão anual apresenta os 12 meses e, para cada mês:

- quantidade de turmas iniciando;
- carga horária planejada;
- quantidade de cronogramas;
- relação das turmas;
- curso;
- unidade;
- modalidade;
- data de início;
- status.

## Relatórios operacionais

Rota:

```text
/relatorios
```

Relatórios iniciais:

### Carga de instrutores

Apresenta:

- instrutor;
- quantidade de encontros;
- total de horas alocadas.

### Utilização de salas e laboratórios

Apresenta:

- recurso;
- quantidade de encontros;
- total de horas ocupadas.

### Conflitos operacionais

Apresenta:

- total de conflitos;
- erros críticos;
- alertas;
- distribuição por código de conflito.

## API

```text
GET /api/reports/dashboard
GET /api/reports/annual-plan
GET /api/reports/workload
GET /api/reports/room-usage
GET /api/reports/conflicts
```

## Filtros

Os endpoints suportam filtro por:

- ano;
- unidade, quando aplicável.

## Carga horária planejada

Nesta fase, a carga planejada é calculada a partir da carga total do curso associada a cada turma.

Em fases posteriores poderemos separar:

- carga planejada;
- carga gerada;
- carga executada;
- carga presencial;
- carga EaD.

## Conflitos no dashboard

O dashboard utiliza o mesmo Validation Engine empregado nas regras operacionais.

Isso evita manter uma segunda lógica de conflito exclusiva para relatórios.

## Próximas evoluções

- exportação de relatórios;
- filtros avançados;
- indicadores por período;
- projeção de capacidade;
- comparação entre unidades;
- gráficos temporais;
- indicadores de aprovação;
- dashboard executivo;
- planejamento de instrutores por mês.
