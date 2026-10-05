import { retrieveChunks } from "./services/vector/vector.service";

const results = await retrieveChunks(
  "What is this PDF about?",
  25,
  4,
);

console.log(results);

