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

export async function searchSimilarChunks(
  query: string,
  documentId: number,
  topK = 3,
) {
  const queryEmbedding = await generateEmbeddings([query]);

  const index = getVectorIndex();

  const result = await index.query({
    vector: queryEmbedding[0]!,
    topK,
    includeMetadata: true,
    filter: {
      documentId: {
        $eq: documentId,
      },
    },
  });

  return result.matches ?? [];
}

export async function retrieveChunks(
  query: string,
  documentId: number,
  topK = 3,
) {
  const matches = await searchSimilarChunks(
    query,
    documentId,
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
      } => chunk !== null,
    );
}