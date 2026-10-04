import 'reflect-metadata';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { WorkflowService } from '../src/schedules/workflow.service';

test('decisão concorrente não sobrescreve status publicado', async () => {
  let writes = 0;
  const tx = {
    $queryRaw: async () => [{ status: 'PUBLISHED' }],
    schedule: {
      updateMany: async () => ({ count: 0 }),
      update: async () => {
        writes++;
        return {};
      },
    },
    approval: {
      create: async () => {
        writes++;
      },
    },
  };
  const service = new WorkflowService(
    {
      schedule: { findUnique: async () => ({ id: 's', status: 'AWAITING_APPROVAL' }) },
      $transaction: async (fn: any) => fn(tx),
    } as any,
    {
      createVersion: async () => {
        writes++;
      },
      audit: async () => {
        writes++;
      },
    } as any,
    {} as any,
  );
  await assert.rejects(() => service.reject('t', 'Teste'), /status|alterado|Transição/);
  assert.equal(writes, 0);
});

test('envio para aprovação valida sob o mesmo bloqueio das edições', async () => {
  let locked = false;
  const tx = {
    $queryRaw: async () => {
      locked = true;
      return [{ status: 'REVIEW' }];
    },
    schedule: {
      updateMany: async () => ({ count: 1 }),
      findUniqueOrThrow: async () => ({ id: 's', status: 'AWAITING_APPROVAL' }),
    },
    approval: { create: async () => {} },
  };
  const validation = {
    validate: async (_id: string, database: unknown) => {
      assert.equal(locked, true);
      assert.equal(database, tx);
      return [];
    },
    resourceConflicts: async () => [],
  };
  const service = new WorkflowService(
    {
      schedule: { findUnique: async () => ({ id: 's', status: 'REVIEW' }) },
      $transaction: async (fn: any) => fn(tx),
    } as any,
    { createVersion: async () => {}, audit: async () => {} } as any,
    validation as any,
  );
  await service.requestApproval('t', 'Teste');
});
