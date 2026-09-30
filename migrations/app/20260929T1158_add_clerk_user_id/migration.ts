#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/445e11c2ccdf0b99b17b98dda9b65c5c9807b5774026a3d0d1c186ea407c0cfa/contract';
import startContract from '../../snapshots/445e11c2ccdf0b99b17b98dda9b65c5c9807b5774026a3d0d1c186ea407c0cfa/contract.json' with { type: 'json' };
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
