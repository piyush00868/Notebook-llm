import { db } from "./prisma/db";
import { generateEmbeddings } from "./services/embedding/embedding.service";

const chunks = await db.orm.public.Chunk
  .where({
    documentId: 21,
  })
  .all();

const embeddings = await generateEmbeddings(
  chunks.map((chunk) => chunk.content),
);

console.log("CHUNKS:", chunks.length);
console.log("EMBEDDINGS:", embeddings.length);
console.log(
  "DIMENSIONS:",
  embeddings.map((embedding) => embedding?.length ?? 0),
);