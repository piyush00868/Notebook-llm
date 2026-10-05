import { extractUrlText } from "./services/ingestion/url.service";

const result = await extractUrlText(
  "https://bytebytego.com/courses/system-design-interview/design-a-rate-limiter",
);

console.log("TITLE:", result.title);
console.log("CONTENT:", result.content);