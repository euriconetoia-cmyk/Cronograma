# Turmas e Regras de Funcionamento

## Objetivo

A turma conecta os dados acadêmicos necessários para a futura geração automática do cronograma.

Cada turma referencia:

- curso;
- versão da matriz;
- unidade;
- modalidade;
- calendário acadêmico;
- data inicial;
- data limite opcional;
- funcionamento semanal;
- equipe;
- regras acadêmicas.

## Regras semanais

Cada dia configurado possui:

- dia da semana;
- horário inicial;
- horário final;
- carga horária diária máxima opcional.

Existe no máximo uma regra por dia da semana em cada turma.

Sábado e domingo exigem autorização explícita na configuração da turma.

## Regras acadêmicas iniciais

- gerar recuperação;
- criar período de matrícula;
- criar aula inaugural;
- dias extras de AVA;
- permitir sábado;
- permitir domingo;
- permitir sobreposição;
- permitir início da próxima UC durante recuperação.

## Equipe

Pessoas podem ser vinculadas à turma com as funções:

- INSTRUCTOR;
- TUTOR;
- MONITOR;
- PLANNER.

## Validações cruzadas

A API verifica:

1. se a matriz pertence ao curso selecionado;
2. se o calendário pertence à unidade da turma;
3. se a data limite é posterior ou igual à data inicial;
4. se sábado e domingo estão autorizados;
5. se o horário final é posterior ao inicial.

## API

```text
GET  /api/people
POST /api/people

GET  /api/classes
GET  /api/classes/:id
POST /api/classes
POST /api/classes/:id/people

GET  /api/classes/:id/schedule-input
```

## Schedule Input

O endpoint `schedule-input` consolida:

- identificação e regras da turma;
- matriz completa;
- funcionamento semanal;
- restrições do calendário;
- equipe.

Esse contrato será a entrada principal da primeira geração completa do Schedule Engine.
