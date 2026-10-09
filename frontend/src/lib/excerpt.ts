import type { DocumentChunk, DocumentSource } from "@/types";

export interface ExcerptRange {
  start: number;
  end: number;
}

/**
 * Locates a chunk's text inside its source document.
 *
 * Chunking writes contiguous slices of the normalised document, so a chunk's
 * content appears verbatim in `document.content`. Finding its offset lets the
 * viewer highlight the exact passage a citation refers to instead of dumping
 * the whole source.
 *
 * Returns `null` when the chunk cannot be placed — a document with no stored
 * text, or content that has since changed. Callers should degrade to showing
 * the document rather than highlighting the wrong region.
 */
export function locateChunk(
  document: Pick<DocumentSource, "content"> | null,
  chunk: DocumentChunk | null | undefined,
): ExcerptRange | null {
  if (!document?.content || !chunk?.content) return null;

  const haystack = document.content;
  const needle = chunk.content;

  // Cheap length guard: a needle longer than the haystack cannot be inside it.
  if (needle.length === 0 || needle.length > haystack.length) return null;

  let start = haystack.indexOf(needle);

  if (start === -1) {
    // Whitespace normalisation can differ slightly between the stored chunk
    // and the document body. Retry on a normalised comparison rather than
    // guessing an offset that would highlight the wrong passage.
    start = indexOfLoose(haystack, needle);
    if (start === -1) return null;
  }

  return { start, end: start + needle.length };
}

/**
 * Fallback match that collapses whitespace on both sides.
 *
 * Returns the offset into the *original* haystack so the caller can still
 * slice it.
 */
function indexOfLoose(haystack: string, needle: string): number {
  const normalise = (value: string) => value.replace(/\s+/g, " ").trim();

  const target = normalise(needle);
  if (!target) return -1;

  let hay = "";
  const offsets: number[] = [];

  for (let index = 0; index < haystack.length; index += 1) {
    const char = haystack[index]!;
    if (/\s/.test(char)) {
      // Collapse runs of whitespace to a single space.
      if (hay.length === 0 || hay.endsWith(" ")) continue;
      hay += " ";
      offsets.push(index);
      continue;
    }
    hay += char;
    offsets.push(index);
  }

  const position = hay.indexOf(target);
  if (position === -1) return -1;

  const startOriginal = offsets[position];
  if (startOriginal === undefined) return -1;

  // Only the start offset is needed; the caller slices by chunk length.
  return startOriginal;
}

/** Finds the chunk matching a citation's `chunkId`. */
export function findChunk(
  chunks: DocumentChunk[] | null | undefined,
  chunkId: number,
): DocumentChunk | null {
  if (!chunks || !Array.isArray(chunks)) return null;
  return chunks.find((chunk) => chunk.id === chunkId) ?? null;
}

/** Builds the excerpt text for a citation, or `null` if unavailable. */
export function excerptFor(
  document: Pick<DocumentSource, "content"> | null,
  chunk: DocumentChunk | null | undefined,
  limit = 1200,
): string | null {
  if (!chunk?.content) return null;

  if (!document?.content) {
    return truncate(chunk.content, limit);
  }

  const range = locateChunk(document, chunk);
  if (!range) return truncate(chunk.content, limit);

  return truncate(document.content.slice(range.start, range.end), limit);
}

function truncate(value: string, limit: number): string {
  if (value.length <= limit) return value;
  return `${value.slice(0, limit).trimEnd()}…`;
}