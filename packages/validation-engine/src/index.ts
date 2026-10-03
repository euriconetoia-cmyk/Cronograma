export interface ValidationIssue {
  code: string;
  severity: 'ERROR' | 'WARNING' | 'INFO';
  message: string;
}

export interface CurricularUnitHours {
  totalHours: number;
  inPersonHours?: number;
  eadHours?: number;
  synchronousHours?: number;
  asynchronousHours?: number;
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

export function validateCurricularUnitHours(data: CurricularUnitHours): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const presenceDistribution = (data.inPersonHours ?? 0) + (data.eadHours ?? 0);
  const syncDistribution = (data.synchronousHours ?? 0) + (data.asynchronousHours ?? 0);

  if (presenceDistribution > data.totalHours) {
    issues.push({
      code: 'UC_PRESENCE_HOURS_EXCEED_TOTAL',
      severity: 'ERROR',
      message: 'A soma das cargas presencial e EaD não pode superar a carga horária total da UC.',
    });
  }

  if (syncDistribution > data.totalHours) {
    issues.push({
      code: 'UC_SYNC_HOURS_EXCEED_TOTAL',
      severity: 'ERROR',
      message: 'A soma das cargas síncrona e assíncrona não pode superar a carga horária total da UC.',
    });
  }

  return issues;
}
