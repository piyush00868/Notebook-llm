#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/13891df9e5b24d3817f808a9e69a8ee2880d2dc88811e77a3ef264af490fba67/contract';
import startContract from '../../snapshots/13891df9e5b24d3817f808a9e69a8ee2880d2dc88811e77a3ef264af490fba67/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/a7d05e7422a48e34c187d507859231aad724083160fae80955629abaf18f74fa/contract';
import endContract from '../../snapshots/a7d05e7422a48e34c187d507859231aad724083160fae80955629abaf18f74fa/contract.json' with { type: 'json' };
import { Migration, MigrationCLI } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [];
  }
}

MigrationCLI.run(import.meta.url, M);
