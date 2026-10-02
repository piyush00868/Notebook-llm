import { db } from "../prisma/db";

type CreateDocumentInput = {
  title: string;
  sourceType: string;
  sourceUrl?: string | undefined;
  storageKey?: string | undefined;
  content?: string | undefined;
  status: string;
  notebookId: number;
};

function normalizeText(content: string) {
  return content
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export async function createDocument(input: CreateDocumentInput) {
  const content = input.content
    ? normalizeText(input.content)
    : null;

  const document = await db.orm.public.Document.create({
    title: input.title,
    sourceType: input.sourceType,
    sourceUrl: input.sourceUrl ?? null,
    storageKey: input.storageKey ?? null,
    content,
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
    .include("notebook", (notebook) =>
      notebook.include("workspace", (workspace) =>
        workspace.include("owner"),
      ),
    )
    .include("chunks")
    .first();

  return document;
}

export async function deleteDocument(id: number) {
  const document = await db.orm.public.Document
    .where({
      id,
    })
    .first();

  if (!document) {
    return null;
  }

  await db.orm.public.Chunk
    .where({
      documentId: id,
    })
    .delete();

  await db.orm.public.Document
    .where({
      id,
    })
    .delete();

  return document;
}