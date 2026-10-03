# Schedule Engine

## Objetivo

Gerar cronogramas acadêmicos de forma determinística a partir de matriz, calendário, regras da turma, modalidade, dias, horários e restrições.

## Entradas

- versão da matriz;
- módulos e UCs;
- data inicial;
- calendário acadêmico;
- dias permitidos;
- horários por dia;
- modalidade;
- carga máxima diária;
- regras de recuperação;
- prazo de AVA;
- regras de sobreposição;
- encontros obrigatórios;
- recursos vinculados.

## Saídas

- início e término de cada UC;
- períodos presenciais;
- períodos EaD;
- encontros;
- webaulas;
- recuperações;
- matrícula;
- aula inaugural;
- término do AVA;
- conflitos encontrados;
- métricas de geração.

## Algoritmo conceitual

1. Carregar turma e matriz.
2. Ordenar módulos e UCs.
3. Carregar calendário acadêmico.
4. Carregar regras de funcionamento.
5. Encontrar o primeiro dia acadêmico válido.
6. Para cada UC:
   1. identificar cargas;
   2. calcular encontros;
   3. localizar datas acadêmicas disponíveis;
   4. distribuir atividades;
   5. criar encontros;
   6. calcular término;
   7. calcular encerramento do AVA;
   8. criar recuperação;
   9. determinar início da próxima UC.
7. Executar Validation Engine.
8. Retornar prévia.

## Função conceitual central

```text
isAcademicDay(date, classGroup, activityType)
```

A função deverá verificar:

- dia da semana;
- calendário;
- bloqueios;
- modalidade;
- tipo da atividade;
- carga diária;
- regras especiais.

## Regras importantes

Não somar simplesmente dias corridos.

Não presumir sábado ou domingo como disponível.

Não presumir feriado como indisponível sem consultar a configuração.

Não permitir sobreposição por padrão.

Permitir virada de ano.

Manter explicabilidade: cada decisão de data deve poder ser justificada.

## Simulação

O mesmo motor deverá executar em modo de simulação sem persistir cronograma oficial.

Deverá permitir comparar cenários de dias, horários e datas iniciais.
