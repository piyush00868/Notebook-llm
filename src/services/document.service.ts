import { db } from "../prisma/db";

type CreateDocumentInput = {
  title: string;
  sourceType: string;
  sourceUrl?: string | undefined;
  storageKey?: string | undefined;
  status: string;
  notebookId: number;
};
export async function createDocument(input: CreateDocumentInput) {
  const document = await db.orm.public.Document.create({
    title: input.title,
    sourceType: input.sourceType,
    sourceUrl: input.sourceUrl ?? null,
    storageKey: input.storageKey ?? null,
    status: input.status,
    notebookId: input.notebookId,
  });

  return document;
}

export async function getDocumentById(id: number) {
  const document = await db.orm.public.Document
    .where({
      id,
    })
    .include("chunks")
    .first();

  return document;
}