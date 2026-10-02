import { db } from "../../prisma/db";

export function chunkText(
  text: string,
  chunkSize = 1000,
  overlap = 200,
): string[] {
  if (chunkSize <= 0) {
    throw new Error("chunkSize must be greater than 0");
  }

  if (overlap < 0 || overlap >= chunkSize) {
    throw new Error("overlap must be >= 0 and less than chunkSize");
  }

  const chunks: string[] = [];

  let start = 0;

  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);

    const chunk = text.slice(start, end).trim();

    if (chunk) {
      chunks.push(chunk);
    }

    if (end === text.length) {
      break;
    }

    start = end - overlap;
  }

  return chunks;
}

export async function createDocumentChunks(documentId: number) {
  const document = await db.orm.public.Document.where({
    id: documentId,
  }).first();

  if (!document) {
    throw new Error("Document not found");
  }

  if (!document.content) {
    throw new Error("Document has no content");
  }

  const chunks = chunkText(document.content);

  for (let index = 0; index < chunks.length; index++) {
    await db.orm.public.Chunk.create({
      content: chunks[index]!,
      chunkIndex: index,
      documentId,
    });
  }

  return chunks;
}
