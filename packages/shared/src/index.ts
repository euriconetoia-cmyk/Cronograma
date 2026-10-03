export type IsoDate = `${number}-${number}-${number}`;

export type AcademicActivityType =
  | 'PRESENCIAL'
  | 'WEBAULA'
  | 'PRATICA'
  | 'LABORATORIO'
  | 'AVALIACAO'
  | 'RECUPERACAO'
  | 'AULA_INAUGURAL'
  | 'OUTRO';

export type ValidationSeverity = 'ERROR' | 'WARNING' | 'INFO';
