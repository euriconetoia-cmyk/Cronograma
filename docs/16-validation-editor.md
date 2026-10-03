# Validation Engine Avançado e Editor de Cronograma

## Objetivo

Validar cronogramas persistidos e permitir ajustes manuais rastreáveis sem misturar regras de cálculo com a interface.

## Validações implementadas

O Validation Engine verifica:

- cronograma vazio;
- término anterior ao início;
- encerramento do AVA anterior ao término do item;
- carga horária do item diferente da UC;
- quantidade de encontros inferior ao configurado;
- item em data bloqueada;
- encontro em data bloqueada;
- horário inválido em encontro;
- sequência cronológica suspeita;
- término após a data limite da turma.

## Severidades

As ocorrências seguem três níveis:

- ERROR;
- WARNING;
- INFO.

Nesta fase, a API retorna as ocorrências ao editor. Regras de bloqueio de aprovação serão tratadas no fluxo de aprovação posterior.

## Editor

Rota:

```text
/turmas/{id}/cronograma/editor
```

O editor permite alterar:

- data de início;
- data de término;
- encerramento do AVA.

Todo ajuste exige uma justificativa.

O banco registra:

- `manuallyAdjusted=true`;
- `adjustmentReason`.

## Regeneração

O usuário pode regenerar todo o cronograma com base nas regras oficiais da turma.

A regeneração substitui o cronograma persistido pelo resultado atual do Schedule Engine.

Isso é deliberado: nesta versão não existe recálculo parcial automático após uma alteração manual.

## Motivo para não implementar recálculo parcial nesta fase

Recalcular apenas os itens seguintes exige preservar corretamente:

- dependências entre UCs;
- recuperação;
- encontros;
- calendário;
- capacidade diária;
- sobreposição autorizada;
- AVA;
- regras futuras de instrutor e sala.

Um deslocamento simples de datas poderia produzir um cronograma inválido.

Por isso esta fase permite:

1. ajuste manual pontual;
2. validação do resultado;
3. regeneração completa pelas regras oficiais.

O recálculo parcial será implementado quando as dependências estiverem formalizadas no motor.

## API

```text
GET   /api/schedules/class/:classGroupId/validate
PATCH /api/schedules/items/:id
```

## Campos de auditoria do ajuste

Cada item possui:

```text
manuallyAdjusted
adjustmentReason
```

O histórico completo por usuário será implementado junto ao módulo de auditoria e versionamento.
