# Correções de integridade — 03/10/2026

Implementados os itens 1 a 4 do relato de problemas. Autenticação e perfis permanecem pendentes; `actorName` ainda não representa identidade autenticada.

## Execução

Versões diretas fixadas, `pnpm@10.34.6` declarado e lockfile atualizado. Os pacotes internos exportam JavaScript CommonJS compilado e declarações TypeScript. API e testes usam o compilador TypeScript com metadados de decorators. O Vitest foi fixado em 3.2.4 após o módulo Rolldown da versão anterior ser bloqueado pelo Controle de Aplicativo do Windows. O schema Prisma e os `as const` do front já estavam válidos nesta cópia. Corrigidos o enum de encontros do motor, tipagem de um teste e os campos da comparação de versões.

## Importação XLSX

- Cabeçalhos vazios preservam suas posições; duplicados geram erro.
- Reconhece Item, Encontro, Horário combinado e Tipo; preserva recuperação e outros tipos de item.
- Exporta/importa tipo e carga do encontro, ordem do item e ID da UC. O front encaminha esses dados na confirmação.
- Preserva professor e sala, resolvendo nomes de forma única; campos omitidos reaproveitam alocações anteriores correspondentes.
- Datas reais, períodos, AVA, números, tipos e horários são validados na prévia e na confirmação. Encontros incompletos não são descartados.
- Valida todo o lote antes de snapshots/escritas. Todas as UCs da matriz e atividades existentes devem estar presentes; faltar encontros existentes/obrigatórios ou duplicar números bloqueia o lote.
- A substituição ocorre em transação, após bloqueio e revalidação do status. A prévia retorna todas as linhas até o limite de 5000, evitando aplicação de amostra truncada.

## Conflitos e workflow

A tela da turma consulta outras turmas não canceladas nos mesmos dias e com os mesmos recursos. As mensagens identificam professor/sala e turmas; todos os pares sobrepostos são enumerados. Professor sem janela no dia também gera erro. Workflow reutiliza as validações da turma.

Cronogramas publicados, aprovados ou aguardando aprovação não podem ser regenerados, importados ou editados. As mutações bloqueiam a linha do cronograma e revalidam o status. Transições condicionam a escrita ao estado permitido. Validação, envio para aprovação, aprovação e publicação compartilham a transação e o bloqueio com as edições.

## Regras

Valida carga das UCs contra curso e matriz na geração, importação e aprovação. O schema não possui carga independente da matriz; seu total é a soma das UCs cadastradas. Encontros fora do período da UC geram erro; encurtamento que deixa encontros fora é recusado. PATCH preserva AVA omitido e rejeita datas impossíveis.

Geração, importação, edição e aprovação bloqueiam datas fora do ano do calendário, incluindo AVA. Ainda não há carregamento automático de calendários sucessivos para turmas plurianuais.

## Verificação

- `pnpm test`: 40 testes passaram; o teste opcional PostgreSQL é ignorado sem habilitação explícita.
- `pnpm typecheck`: passou, incluindo validação Prisma.
- `pnpm build`: passou, API e front.
- `pnpm install --lockfile-only --frozen-lockfile --offline`: confirmou consistência do lockfile.
- API compilada iniciou; health e leitura retornaram 200; confirmação com 30/02 retornou 400 pelo DTO.
- Teste real PostgreSQL de geração → exportação → reimportação passou, preservando webaula, carga de 2h numa janela de 4h, professor, sala e recuperação. Todo o teste foi revertido por rollback.
- A execução adicional desse teste, ampliada para aprovação/publicação, não foi autorizada; essa ampliação permanece sem execução no PostgreSQL. As regressões de workflow passaram na suíte da API.

O front ainda não possui testes automatizados de navegador. Esta pasta não contém `.git`, portanto não houve commit. O residual de uma instalação interrompida foi mantido em `node_modules-before-repair` e está ignorado; a instalação ativa está em `node_modules`.

## Próxima etapa

Revisar `docs/superpowers/specs/2026-10-03-autenticacao-design.md` antes de implementar login, sessões e perfis. O sistema continua sem autenticação até essa implementação.

## Preparação para publicação no GitHub

Repositório: https://github.com/euriconetoia-cmyk/Cronograma. A `main` contém somente o commit inicial; a branch de correções `fix/integridade-cronograma` foi criada a partir de `feat/fase-10-visual-institucional` para preservar o histórico completo e a sidebar institucional. A cópia conectada ao Git está em `D:/Cronograma-pronto-para-teste/.publish-checkout`.

CI agora usa pnpm 10.34.6 e instalação com lockfile congelado. Uma URL de exemplo sem credenciais reais é suficiente para validar o schema durante os testes que não conectam ao banco. Os arquivos foram formatados para satisfazer a verificação existente da CI. Ambientes locais, dependências e artefatos de build foram excluídos do commit.
