import { Pinecone } from "@pinecone-database/pinecone";
import { db } from "../../prisma/db";
import { generateEmbeddings } from "../embedding/embedding.service";

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

const indexName = process.env.PINECONE_INDEX_NAME!;

export function getVectorIndex() {
  return pinecone.index({
    name: indexName,
  });
}

export async function indexDocumentChunks(documentId: number) {
  const chunks = await db.orm.public.Chunk
    .where({
      documentId,
    })
    .all();

  if (chunks.length === 0) {
    return 0;
  }

  const embeddings = await generateEmbeddings(
    chunks.map((chunk) => chunk.content),
  );

  const index = getVectorIndex();

  await index.upsert({
    records: chunks.map((chunk, index) => ({
      id: `chunk-${chunk.id}`,
      values: embeddings[index]!,
      metadata: {
        documentId: chunk.documentId,
        chunkId: chunk.id,
        chunkIndex: chunk.chunkIndex,
      },
    })),
  });

  return chunks.length;
}