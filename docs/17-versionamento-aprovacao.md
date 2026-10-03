# Versionamento, Auditoria e Aprovação

## Objetivo

Preservar o histórico de evolução do cronograma e controlar seu fluxo de revisão, aprovação e publicação.

## Versionamento

Cada versão registra:

- número da versão;
- autor;
- motivo;
- data;
- snapshot completo do cronograma.

Versões são criadas após:

- geração inicial;
- regeneração;
- ajuste manual;
- transições relevantes de workflow.

A regeneração preserva o mesmo registro de Schedule e substitui apenas os itens, evitando apagar o histórico.

## Comparação

A API permite comparar duas versões.

São identificadas mudanças em:

- data inicial;
- data final;
- encerramento do AVA;
- carga horária;
- itens adicionados;
- itens removidos;
- status.

Endpoint:

```text
GET /api/schedules/class/:classGroupId/compare/:fromVersion/:toVersion
```

## Auditoria

A auditoria registra:

- tipo da entidade;
- identificador;
- ação;
- autor;
- motivo;
- alterações;
- data e hora.

## Workflow

Estados utilizados nesta fase:

```text
GENERATED
REVIEW
AWAITING_APPROVAL
APPROVED
PUBLISHED
```

Fluxo principal:

```text
GENERATED
  ↓
REVIEW
  ↓
AWAITING_APPROVAL
  ↓
APPROVED
  ↓
PUBLISHED
```

A coordenação também pode:

- solicitar ajustes;
- rejeitar.

Nesses casos o cronograma retorna para revisão.

## Bloqueio por validação

Um cronograma com erros de severidade ERROR não pode:

- ser enviado para aprovação;
- ser aprovado.

Warnings não bloqueiam o fluxo nesta fase.

## Decisões de aprovação

São registradas como:

- PENDING;
- APPROVED;
- REJECTED;
- CHANGES_REQUESTED.

Cada decisão armazena autor, comentário e data.

## API

```text
GET  /api/schedules/class/:classGroupId/history

POST /api/schedules/class/:classGroupId/review
POST /api/schedules/class/:classGroupId/request-approval
POST /api/schedules/class/:classGroupId/approve
POST /api/schedules/class/:classGroupId/reject
POST /api/schedules/class/:classGroupId/request-changes
POST /api/schedules/class/:classGroupId/publish

GET  /api/schedules/class/:classGroupId/compare/:fromVersion/:toVersion
```

## Interface

Rota:

```text
/turmas/{id}/cronograma/workflow
```

A tela apresenta:

- status atual;
- versões;
- aprovações;
- auditoria;
- formulário de ação do workflow.

## Autenticação

Enquanto a autenticação ainda não está integrada ao workflow, o autor é informado explicitamente nas ações.

Quando o módulo de autenticação for concluído, esse campo deverá ser preenchido automaticamente a partir do usuário autenticado.
