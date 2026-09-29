#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/445e11c2ccdf0b99b17b98dda9b65c5c9807b5774026a3d0d1c186ea407c0cfa/contract';
import endContract from '../../snapshots/445e11c2ccdf0b99b17b98dda9b65c5c9807b5774026a3d0d1c186ea407c0cfa/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/62f79e2b9410908b6a73be6cfca00f09ca928a00f7e52452a8bda90df51909dd/contract';
import startContract from '../../snapshots/62f79e2b9410908b6a73be6cfca00f09ca928a00f7e52452a8bda90df51909dd/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col } from '@prisma/orm-postgres/migration';

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
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
