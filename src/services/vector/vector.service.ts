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
  
  const document = await db.orm.public.Document
    .where({
      id: documentId,
    })
    .first();

  if (!document) {
    throw new Error("Document not found");
  }

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
        notebookId: document.notebookId,
        chunkId: chunk.id,
        chunkIndex: chunk.chunkIndex,
      },
    })),
  });

  return chunks.length;
}

export async function searchSimilarChunks(
  query: string,
  notebookId: number,
  topK = 3,
) {
  const queryEmbedding = await generateEmbeddings([query]);

  const index = getVectorIndex();

  const result = await index.query({
    vector: queryEmbedding[0]!,
    topK,
    includeMetadata: true,
    filter: {
      notebookId: {
        $eq: notebookId,
      },
    },
  });

  return result.matches ?? [];
}
export async function retrieveChunks(
  query: string,
  notebookId: number,
  topK = 3,
) {
  const matches = await searchSimilarChunks(
    query,
    notebookId,
    topK,
  );

  if (matches.length === 0) {
    return [];
  }
  const chunkIds = matches
    .map((match) => match.metadata?.chunkId)
    .filter((id): id is number => typeof id === "number");
 if (chunkIds.length === 0) {
    return [];
  }

 const chunks = [];

for (const chunkId of chunkIds) {
const chunk = await db.orm.public.Chunk
  .where({
    id: chunkId,
  })
  .include("document")
  .first();

  if (chunk) {
    chunks.push(chunk);
  }
}

  const chunkMap = new Map(
    chunks.map((chunk) => [chunk.id, chunk]),
  );

  return matches
    .map((match) => {
      const chunkId = match.metadata?.chunkId;

      if (typeof chunkId !== "number") {
        return null;
      }

      const chunk = chunkMap.get(chunkId);

      if (!chunk) {
        return null;
      }

      return {
        chunkId: chunk.id,
        chunkIndex: chunk.chunkIndex,
        score: match.score,
        content: chunk.content,
        documentId: chunk.documentId,
        documentTitle: chunk.document.title,
      };
    })
    .filter(
      (
        chunk,
      ): chunk is {
        chunkId: number;
        chunkIndex: number;
        score: number | undefined;
        content: string;
        documentId: number;
        documentTitle: string;
      } => chunk !== null,
    );
}