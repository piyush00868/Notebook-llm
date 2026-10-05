import { YoutubeTranscript } from "youtube-transcript";

function extractYoutubeVideoId(url: string) {
  const parsed = new URL(url);

  if (parsed.hostname === "youtu.be") {
    return parsed.pathname.slice(1);
  }

  if (
    parsed.hostname === "youtube.com" ||
    parsed.hostname === "www.youtube.com"
  ) {
    return parsed.searchParams.get("v");
  }

  throw new Error("Invalid YouTube URL");
}

export async function extractYoutubeTranscript(url: string) {
  const videoId = extractYoutubeVideoId(url);

  if (!videoId) {
    throw new Error("Could not extract YouTube video ID");
  }

  const transcript =
    await YoutubeTranscript.fetchTranscript(videoId);

  if (!transcript.length) {
    throw new Error("No transcript available for this video");
  }

  const content = transcript
    .map((item) => item.text)
    .join(" ");

  return {
    videoId,
    content,
  };
}