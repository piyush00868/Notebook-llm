import type { Contract as End } from '../../snapshots/61a955d6f37b736b5d53c9c65d19e46cdeaaf2dc80eb945005ddf94bfe4c7a67/contract';
import endContract from '../../snapshots/61a955d6f37b736b5d53c9c65d19e46cdeaaf2dc80eb945005ddf94bfe4c7a67/contract.json' with { type: 'json' };

import type { Contract as Start } from '../../snapshots/62f79e2b9410908b6a73be6cfca00f09ca928a00f7e52452a8bda90df51909dd/contract';
import startContract from '../../snapshots/62f79e2b9410908b6a73be6cfca00f09ca928a00f7e52452a8bda90df51909dd/contract.json' with { type: 'json' };

import { Migration, MigrationCLI } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      // 1. Missing Chat index
      this.createIndex({
        schema: 'public',
        table: 'Chat',
        index: 'Chat_notebookId_idx',
        columns: ['notebookId'],
      }),

      // 2. Missing ChatMessage index
      this.createIndex({
        schema: 'public',
        table: 'ChatMessage',
        index: 'ChatMessage_chatId_idx',
        columns: ['chatId'],
      }),

      // 3. Chunk -> Document CASCADE
      this.dropConstraint({
        schema: 'public',
        table: 'Chunk',
        constraint: 'Chunk_documentId_fkey',
        kind: 'foreignKey',
      }),

      this.addForeignKey({
        schema: 'public',
        table: 'Chunk',
        foreignKey: {
          name: 'Chunk_documentId_fkey',
          columns: ['documentId'],
          references: {
            schema: 'public',
            table: 'Document',
            columns: ['id'],
          },
          onDelete: 'cascade',
        },
      }),

      // 4. Document -> Notebook CASCADE
      this.dropConstraint({
        schema: 'public',
        table: 'Document',
        constraint: 'Document_notebookId_fkey',
        kind: 'foreignKey',
      }),

      this.addForeignKey({
        schema: 'public',
        table: 'Document',
        foreignKey: {
          name: 'Document_notebookId_fkey',
          columns: ['notebookId'],
          references: {
            schema: 'public',
            table: 'Notebook',
            columns: ['id'],
          },
          onDelete: 'cascade',
        },
      }),

      // 5. Notebook -> Workspace CASCADE
      this.dropConstraint({
        schema: 'public',
        table: 'Notebook',
        constraint: 'Notebook_workspaceId_fkey',
        kind: 'foreignKey',
      }),

      this.addForeignKey({
        schema: 'public',
        table: 'Notebook',
        foreignKey: {
          name: 'Notebook_workspaceId_fkey',
          columns: ['workspaceId'],
          references: {
            schema: 'public',
            table: 'Workspace',
            columns: ['id'],
          },
          onDelete: 'cascade',
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);