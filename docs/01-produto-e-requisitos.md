# Produto e Requisitos

## Objetivo

Criar um sistema web profissional para cadastrar cursos, matrizes curriculares, modalidades, calendários acadêmicos e turmas e gerar automaticamente o cronograma completo de cada turma.

O sistema substituirá progressivamente o processo atual baseado em planilhas Excel.

## Escopo funcional

O sistema deverá permitir:

- autenticação e controle de acesso;
- cadastro de unidades;
- cadastro de cursos;
- versionamento de matrizes curriculares;
- cadastro de módulos e unidades curriculares;
- cadastro configurável de modalidades;
- calendário acadêmico por unidade e ano;
- cadastro de feriados, recessos, dias não letivos e bloqueios;
- criação de turmas;
- configuração de dias e horários;
- vinculação de tutor, monitor e instrutor;
- geração automática de cronogramas;
- simulação de cenários;
- editor visual;
- validação de conflitos;
- versionamento de cronogramas;
- aprovação e publicação;
- exportação em Excel, PDF e CSV;
- relatórios e dashboards;
- auditoria;
- importação futura de planilhas.

## Perfis iniciais

### Administrador

Acesso integral.

### Coordenação

Consulta, revisão, solicitação de ajustes e aprovação.

### Planejamento

Cadastro, geração, edição, simulação e envio para aprovação.

### Consulta

Acesso somente para leitura e relatórios.

## Dashboard

Indicadores mínimos:

- total de turmas;
- programadas;
- em andamento;
- concluídas;
- próximas de iniciar;
- cursos cadastrados;
- carga horária planejada;
- cronogramas com conflitos;
- cronogramas aguardando aprovação;
- turmas sem tutor;
- turmas sem instrutor;
- calendários incompletos.

Filtros:

- ano;
- unidade;
- curso;
- modalidade;
- status.

## Status do cronograma

- Rascunho
- Gerado
- Em revisão
- Aguardando aprovação
- Aprovado
- Publicado
- Em andamento
- Concluído
- Cancelado

## Critério principal de sucesso

O usuário deve conseguir selecionar um curso e uma matriz, informar unidade, modalidade, data inicial, dias e horários e gerar automaticamente um cronograma completo sem precisar calcular datas manualmente.
