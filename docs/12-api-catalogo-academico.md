# API do Catálogo Acadêmico

## Prefixo

Todos os endpoints usam o prefixo:

```text
/api
```

## Unidades

```text
GET  /api/units
POST /api/units
```

Campos principais:

- name
- code
- city
- state
- active

## Modalidades

```text
GET  /api/modalities
POST /api/modalities
```

Parâmetros iniciais:

- allowsEad
- allowsSynchronous
- allowsInPersonMeetings
- allowsWebClasses
- defaultDailyHours
- defaultAvaExtraDays

## Cursos

```text
GET  /api/courses
POST /api/courses
```

O curso pode referenciar:

- unidade responsável;
- modalidade padrão.

## Matrizes curriculares

```text
GET  /api/curriculum/versions
POST /api/curriculum/versions
POST /api/curriculum/modules
POST /api/curriculum/units
```

A consulta de versões retorna curso, módulos e UCs em estrutura hierárquica.

## Regra inicial de carga horária

Ao cadastrar uma UC:

- CH presencial + CH EaD não pode superar a CH total;
- CH síncrona + CH assíncrona não pode superar a CH total.

A validação será ampliada nas próximas fases para verificar também a consistência global da matriz.
