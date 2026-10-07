import type { Contract as End } from '../../snapshots/61a955d6f37b736b5d53c9c65d19e46cdeaaf2dc80eb945005ddf94bfe4c7a67/contract';

import endContract from '../../snapshots/61a955d6f37b736b5d53c9c65d19e46cdeaaf2dc80eb945005ddf94bfe4c7a67/contract.json' with { type: 'json' };

import type { Contract as Start } from '../../snapshots/13891df9e5b24d3817f808a9e69a8ee2880d2dc88811e77a3ef264af490fba67/contract';
import startContract from '../../snapshots/13891df9e5b24d3817f808a9e69a8ee2880d2dc88811e77a3ef264af490fba67/contract.json' with { type: 'json' };import { Migration, MigrationCLI, col, fn, primaryKey } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createTable({
        schema: 'public',
        table: 'Chat',
        columns: [
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('notebookId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'ChatMessage',
        columns: [
          col('chatId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('content', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('role', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createIndex({
        schema: 'public',
        table: 'Chat',
        index: 'Chat_notebookId_idx',
        columns: ['notebookId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'ChatMessage',
        index: 'ChatMessage_chatId_idx',
        columns: ['chatId'],
      }),
      this.addForeignKey({
  schema: 'public',
  table: 'Chat',
  foreignKey: {
    name: 'Chat_notebookId_fkey',
    columns: ['notebookId'],
    references: {
      schema: 'public',
      table: 'Notebook',
      columns: ['id'],
    },
    onDelete: 'cascade',
  },
}),

this.addForeignKey({
  schema: 'public',
  table: 'ChatMessage',
  foreignKey: {
    name: 'ChatMessage_chatId_fkey',
    columns: ['chatId'],
    references: {
      schema: 'public',
      table: 'Chat',
      columns: ['id'],
    },
    onDelete: 'cascade',
  },
}),
    ];
  }
}
MigrationCLI.run(import.meta.url, M);