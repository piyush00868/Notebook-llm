import { retrieveChunks } from "./services/vector/vector.service";

const results = await retrieveChunks(
  "What is this PDF about?",
  1,
  3,
);

console.log(results);

