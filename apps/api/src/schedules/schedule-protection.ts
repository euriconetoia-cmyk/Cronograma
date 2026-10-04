import { BadRequestException } from '@nestjs/common';
import { Prisma, ScheduleStatus } from '@cronograma/database';

export function assertScheduleEditable(status?: ScheduleStatus) {
  if (status === 'PUBLISHED')
    throw new BadRequestException('Cronograma publicado não pode ser alterado ou regerado.');
  if (status === 'APPROVED' || status === 'AWAITING_APPROVAL') {
    throw new BadRequestException(
      'Cronograma aprovado ou aguardando aprovação não pode ser alterado. Solicite revisão primeiro.',
    );
  }
}

export async function lockSchedule(tx: Prisma.TransactionClient, id: string) {
  const rows = await tx.$queryRaw<{ status: ScheduleStatus }[]>`
    SELECT "status" FROM "Schedule" WHERE "id" = ${id} FOR UPDATE
  `;
  if (!rows[0]) throw new BadRequestException('Cronograma não encontrado.');
  return rows[0].status;
}

export async function lockEditableSchedule(tx: Prisma.TransactionClient, id: string) {
  assertScheduleEditable(await lockSchedule(tx, id));
}
