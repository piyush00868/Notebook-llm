import { answerQuestion } from "./services/RAG/rag.service";

const result = await answerQuestion(
  "What is this PDF about?",
  26,
  4,
);

console.log(JSON.stringify(result, null, 2));