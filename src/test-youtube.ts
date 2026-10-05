import { extractYoutubeTranscript } from "./services/ingestion/youtube.service";
const result = await extractYoutubeTranscript(
  "https://youtu.be/kjGP_kBQdVc?si=8R_hivcuRd4KmVdk",
);

console.log(
  "TRANSCRIPT CHARACTERS:",
  result.content.length,
);

console.log(
  "FIRST 500:",
  result.content.slice(0, 500),
);

console.log(
  "LAST 500:",
  result.content.slice(-500),
);