import { indexDocumentChunks } from "./services/vector/vector.service";

const count = await indexDocumentChunks(22);

console.log("VECTORS INDEXED:", count);