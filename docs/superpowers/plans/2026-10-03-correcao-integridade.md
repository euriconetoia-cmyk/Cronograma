# Correção de integridade do cronograma

Objetivo: tornar a execução reproduzível, impedir perda silenciosa na importação e aplicar as regras documentadas antes da aprovação.

1. Fixar versões a partir do lockfile existente. Compilar os pacotes internos em CommonJS com declarações e executar a API compilada, preservando metadados. Validar Prisma, TypeScript e build.
2. Adicionar regressões da importação XLSX: exportação/reimportação, cabeçalho vazio, datas impossíveis, encontro parcial, recuperação, webaula e recursos. Validar todo o lote antes da transação; não aceitar substituição parcial da matriz nem remover encontros existentes sem substitutos.
3. Bloquear geração, importação e edição de cronogramas publicados ou em aprovação. Revalidar o status dentro da transação com bloqueio da linha.
4. Comparar encontros de outras turmas usando os mesmos recursos/datas. Enumerar todos os pares; identificar recursos e turmas. Ausência de janela de disponibilidade é erro. Reutilizar a checagem no workflow.
5. Validar soma de UCs contra curso/matriz, encontros no período da UC e ano do calendário, incluindo AVA. Preservar AVA omitido no PATCH. Bloquear encurtamento que deixa encontros fora do período.
6. Executar todos os testes e builds; registrar limitações do ambiente. A pasta não contém .git, portanto nenhum commit é possível nesta cópia.

Autenticação constitui um subsistema novo: preparar desenho concreto com senha segura, sessão e RBAC para revisão, conforme a skill de brainstorming, antes de implementação.
