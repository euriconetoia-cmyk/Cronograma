# Validation Engine

## Objetivo

Validar cronogramas antes e depois da geração e também após alterações manuais.

## Severidades

### Erro
Pode impedir aprovação ou publicação.

### Alerta
Exige atenção, mas pode permitir salvamento.

### Informação
Contexto útil ao planejador.

## Validações mínimas

- atividade em feriado;
- atividade em recesso;
- atividade em data bloqueada;
- carga diária excedida;
- sobreposição de UCs;
- conflito de instrutor;
- conflito de sala;
- carga da matriz diferente da carga do curso;
- UC sem carga horária;
- cronograma incompleto;
- encontro obrigatório ausente;
- data final anterior à inicial;
- UC fora de sequência;
- carga não totalmente distribuída;
- calendário anual ausente;
- equipe obrigatória ausente.

## Resultado padrão

Cada ocorrência deverá retornar:

- código;
- severidade;
- mensagem;
- entidade relacionada;
- campo;
- data, quando aplicável;
- sugestão de correção, quando possível.

Exemplo:

```json
{
  "code": "INSTRUCTOR_CONFLICT",
  "severity": "ERROR",
  "message": "Instrutor possui outro encontro no mesmo período.",
  "date": "2027-03-10"
}
```

## Regra

Validação deve ser independente da interface e reutilizável por API, importação, editor visual e testes.
