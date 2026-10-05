import { retrieveChunks } from "../vector/vector.service";
import { generateAnswer } from "../LLM/llm.service";

export async function answerQuestion(
  question: string,
  notebookId: number,
  topK = 3,
) {
  const chunks = await retrieveChunks(
    question,
    notebookId,
    topK,
  );

  if (chunks.length === 0) {
    return {
      answer: "I could not find relevant information in this document.",
      sources: [],
    };
  }

  const context = chunks
    .map(
      (chunk) =>
        `[Chunk ${chunk.chunkIndex}]\n${chunk.content}`,
    )
    .join("\n\n");

  const answer = await generateAnswer(
    question,
    context,
  );

  return {
    answer,
    sources: chunks.map((chunk) => ({
      chunkId: chunk.chunkId,
      chunkIndex: chunk.chunkIndex,
      score: chunk.score,
    })),
  };
}