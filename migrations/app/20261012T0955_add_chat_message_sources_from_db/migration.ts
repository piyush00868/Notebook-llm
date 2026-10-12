#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/61a955d6f37b736b5d53c9c65d19e46cdeaaf2dc80eb945005ddf94bfe4c7a67/contract';
import startContract from '../../snapshots/61a955d6f37b736b5d53c9c65d19e46cdeaaf2dc80eb945005ddf94bfe4c7a67/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/6c99295ac6ea9a961f1b50a4bac5fb8168a1e4441fbbf77f0f2e35d372526db3/contract';
import endContract from '../../snapshots/6c99295ac6ea9a961f1b50a4bac5fb8168a1e4441fbbf77f0f2e35d372526db3/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col } from '@prisma/orm-postgres/migration';
export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

override get operations() {
  return [
    this.addColumn({
      schema: "public",
      table: "ChatMessage",
      column: col("sources", "jsonb", {
        codecRef: { codecId: "pg/jsonb@1" },
      }),
    }),
  ];
}
}

MigrationCLI.run(import.meta.url, M);
