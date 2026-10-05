import { db } from "./prisma/db";
import { generateEmbeddings } from "./services/embedding/embedding.service";
import { getVectorIndex } from "./services/vector/vector.service";

const chunk = await db.orm.public.Chunk
  .where({
    documentId: 21,
  })
  .first();

if (!chunk) {
  throw new Error("No chunk found");
}

const embeddings = await generateEmbeddings([chunk.content] );

const index = getVectorIndex();

await index.upsert({
  records: [
    {
      id: `chunk-${chunk.id}`,
      values: embeddings[0] ?? [],
      metadata: {
        documentId: chunk.documentId,
        chunkId: chunk.id,
        chunkIndex: chunk.chunkIndex,
        
      },
    },
  ],    
});

console.log("VECTOR STORED:", `chunk-${chunk.id}`);