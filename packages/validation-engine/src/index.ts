export interface ValidationIssue {
  code: string;
  severity: 'ERROR' | 'WARNING' | 'INFO';
  message: string;
}

export function validateDateOrder(start: Date, end: Date): ValidationIssue[] {
  if (end.getTime() < start.getTime()) {
    return [
      {
        code: 'END_BEFORE_START',
        severity: 'ERROR',
        message: 'A data de término não pode ser anterior à data de início.',
      },
    ];
  }

  return [];
}
