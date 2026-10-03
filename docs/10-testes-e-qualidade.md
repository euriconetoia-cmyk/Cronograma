# Testes e Qualidade

## Estratégia

O Schedule Engine deve ser desenvolvido com forte cobertura de testes unitários.

Também existirão testes de integração e end to end para os fluxos principais.

## Cenários obrigatórios do Schedule Engine

- curso sem feriados;
- curso atravessando feriado;
- curso atravessando fim de semana;
- mudança de ano;
- aulas somente em dias específicos;
- somente sábado;
- recuperação;
- sem recuperação;
- múltiplos encontros;
- webaula;
- sobreposição permitida;
- sobreposição proibida;
- conflito de instrutor;
- conflito de sala;
- AVA adicional;
- carga fracionada.

## Testes de regressão

Cronogramas reais já utilizados poderão ser convertidos em fixtures.

Procedimento:

1. carregar dados de entrada conhecidos;
2. executar o motor;
3. comparar saída;
4. detectar mudanças não intencionais.

## Testes de integração

Cobrir:

- criação de curso;
- matriz;
- turma;
- calendário;
- geração;
- validação;
- aprovação;
- exportação.

## End to end

Fluxo crítico:

login -> criar turma -> gerar cronograma -> corrigir conflito -> enviar para aprovação -> aprovar -> exportar.

## Qualidade

Toda entrega deverá informar:

- objetivo;
- arquivos alterados;
- regras implementadas;
- testes;
- como validar manualmente.
