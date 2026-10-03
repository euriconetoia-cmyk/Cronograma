# Guia de Contribuição

## Fluxo de trabalho

Não trabalhar diretamente na branch `main` para novas funcionalidades.

Criar branches por objetivo.

Exemplos:

```text
feat/course-management
feat/schedule-engine
fix/calendar-validation
docs/database-model
refactor/schedule-rules
```

## Commits

Usar mensagens claras e pequenas.

Exemplos:

```text
feat: adiciona cadastro de cursos
fix: corrige cálculo de feriado
docs: documenta schedule engine
test: adiciona cenário de mudança de ano
```

## Pull Requests

Todo PR deverá informar:

- objetivo;
- problema resolvido;
- principais alterações;
- regras de negócio afetadas;
- testes realizados;
- instruções para teste manual;
- riscos conhecidos.

## Regras

1. Não colocar regra acadêmica crítica diretamente na interface.
2. Não alterar comportamento do Schedule Engine sem teste.
3. Toda migration deve estar no Git.
4. Alterações relevantes de arquitetura devem ser documentadas.
5. Nunca adicionar credenciais ao repositório.
6. Preferir PRs pequenos e revisáveis.

## Definição de pronto

Uma tarefa somente será considerada concluída quando:

- código estiver implementado;
- testes passarem;
- regra estiver documentada quando necessário;
- revisão estiver concluída;
- fluxo manual tiver sido validado.
