#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/62f79e2b9410908b6a73be6cfca00f09ca928a00f7e52452a8bda90df51909dd/contract';
import startContract from '../../snapshots/62f79e2b9410908b6a73be6cfca00f09ca928a00f7e52452a8bda90df51909dd/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/a765e978761f999cb4ac656619f1158d649fbe8a6ef789d2cb135fb8742bc672/contract';
import endContract from '../../snapshots/a765e978761f999cb4ac656619f1158d649fbe8a6ef789d2cb135fb8742bc672/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, placeholder } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addColumn({
        schema: 'public',
        table: 'Document',
        column: col('content', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'User',
        column: col('clerkUserId', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.dataTransform(endContract, 'backfill-User-clerkUserId', {
        check: () => placeholder('backfill-User-clerkUserId:check'),
        run: () => placeholder('backfill-User-clerkUserId:run'),
      }),
      this.setNotNull({ schema: 'public', table: 'User', column: 'clerkUserId' }),
      this.addUnique({
        schema: 'public',
        table: 'User',
        constraint: 'User_clerkUserId_key',
        columns: ['clerkUserId'],
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
