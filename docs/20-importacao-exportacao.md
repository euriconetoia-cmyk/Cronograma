# Importação e Exportação

## Objetivo

Reduzir a dependência das planilhas atuais sem perder compatibilidade com os cronogramas já utilizados.

A estratégia desta fase é:

1. exportar cronogramas gerados pelo sistema;
2. analisar planilhas existentes;
3. detectar o formato;
4. mapear as colunas;
5. pré-validar os dados;
6. permitir confirmação explícita antes de gravar.

## Exportação

Formatos implementados:

- Excel XLSX;
- CSV.

Endpoints:

```text
GET /api/import-export/schedules/:classGroupId.xlsx
GET /api/import-export/schedules/:classGroupId.csv
```

A exportação inclui:

- turma;
- curso;
- matriz;
- UC ou item;
- tipo;
- carga horária;
- início;
- término;
- encerramento do AVA;
- número do encontro;
- data do encontro;
- horário;
- instrutor;
- sala ou laboratório.

## Importação assistida

Rota visual:

```text
/importar
```

A importação é executada em duas etapas.

### Etapa 1: prévia

```text
POST /api/import-export/preview
```

Recebe arquivo XLSX em multipart/form-data.

O sistema:

- localiza o cabeçalho;
- identifica a primeira aba utilizável;
- detecta o modelo;
- tenta mapear as colunas;
- normaliza datas e números;
- identifica linhas inválidas;
- retorna até 200 linhas para revisão.

### Modelos reconhecidos inicialmente

#### TECHNICAL

Modelo com características de curso técnico, incluindo indicadores como dias de estudo e encontros.

#### QUALIFICATION

Modelo de qualificação com webaula e recuperação.

#### DAILY_DISTRIBUTION

Modelo com distribuição de encontros por data.

#### UNKNOWN

Arquivo sem elementos suficientes para classificação automática.

A classificação serve como apoio ao mapeamento e não limita a arquitetura aos três modelos.

## Mapeamento automático

Campos reconhecidos:

- curso;
- módulo;
- Unidade Curricular;
- CH total;
- CH presencial;
- CH EaD;
- início;
- término;
- fim do AVA;
- código da turma/evento;
- tutor;
- monitor;
- número do encontro;
- data do encontro;
- horário inicial;
- horário final;
- recuperação.

Os nomes são normalizados para reduzir problemas com acentuação e pequenas variações de cabeçalho.

## Validação da prévia

Erros atuais:

- UC não identificada;
- início não identificado;
- término não identificado.

Alertas:

- carga horária não identificada;
- curso não identificado.

Linhas com erro impedem a confirmação pela interface.

## Etapa 2: confirmação

```text
POST /api/import-export/apply
```

A confirmação exige:

- turma de destino;
- responsável pela importação;
- linhas normalizadas válidas.

## Correspondência com a matriz

A UC importada precisa corresponder a uma UC da versão de matriz associada à turma.

A correspondência é feita pelo nome normalizado da UC.

Se uma UC não for encontrada, a importação é interrompida antes de alterar o cronograma.

## Preservação de histórico

Se a turma já possuir cronograma:

1. uma versão é criada antes da importação;
2. os itens atuais são substituídos;
3. o cronograma importado passa para REVIEW;
4. uma nova versão é criada;
5. a operação é registrada na auditoria.

A ação registrada é:

```text
IMPORT_EXCEL
```

## Regra de segurança

A simples seleção de um arquivo nunca altera o banco.

Somente a ação explícita de confirmação pode substituir o cronograma da turma.

## Limitações atuais

- importação inicial suporta XLSX;
- a correspondência de UC ainda é baseada no nome normalizado;
- estruturas com células mescladas complexas podem exigir ajustes específicos;
- recuperação presente na planilha ainda não gera automaticamente um item separado;
- tutor e monitor são detectados na prévia, mas não são vinculados automaticamente nesta fase;
- múltiplas abas ainda não são importadas em conjunto.

## Próximas evoluções

- perfil de mapeamento salvo por modelo;
- seleção de aba;
- mapeamento manual de colunas;
- importação de tutor e monitor;
- recuperação importada;
- suporte a CSV;
- importação de matriz e curso quando inexistentes;
- relatório de diferenças entre planilha e cronograma gerado.
