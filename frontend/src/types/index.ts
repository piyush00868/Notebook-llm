/**
 * Domain types.
 *
 * These mirror the shapes returned by the existing Express backend
 * (`/users/me`, `/workspaces/*`, `/notebooks/*`, `/documents/*`).
 * The backend is treated as read-only; anything it does not expose is
 * represented as optional and surfaced in the UI as unavailable rather
 * than faked.
 */

/** `GET /users/me` */
export interface User {
  id: number;
  clerkUserId: string | null;
  email: string;
  username: string | null;
  name: string | null;
  createdAt: string;
  updatedAt: string;
}

/** `GET /workspaces/:id` */
export interface Workspace {
  id: number;
  name: string;
  ownerId: number;
  owner?: User | null;
  notebooks: Notebook[];
  createdAt: string;
  updatedAt: string;
}

export type Notebook = {
  id: number;
  name: string;
  workspaceId: number;
  workspace?: Workspace | null;
  documents?: DocumentSource[] | null;
  createdAt: string;
  updatedAt: string;
};

/**
 * `GET /notebooks/:id` embeds `documents`.
 * The ingestion controllers persist `sourceType` as free-form strings,
 * so this is a known set with a safe fallback.
 */
export type SourceType = "PDF" | "WEB" | "URL" | "YOUTUBE" | "TEXT" | "TXT";

/** Backend document status vocabulary. */
export type DocumentStatus =
  | "PENDING"
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED";

export type DocumentSource = {
  id: number;
  title: string;
  sourceType: SourceType | string;
  sourceUrl: string | null;
  storageKey: string | null;
  status: DocumentStatus | string;
  notebookId: number;
  /**
   * Persisted extracted text. Not returned in list payloads we rely on;
   * only `GET /documents/:id` includes it.
   */
  content?: string | null;
  chunks?: DocumentChunk[] | null;
  createdAt: string;
  updatedAt: string;
};

export type DocumentChunk = {
  id: number;
  content: string;
  chunkIndex: number;
  documentId: number;
  pineconeId: string | null;
  createdAt: string;
};

/**
 * A citation returned by `POST /notebooks/:id/ask`.
 *
 * The response omits the chunk text, but `GET /documents/:id` returns the
 * document's `chunks`, so the UI resolves the cited passage locally by
 * matching `chunkId` — no extra endpoint required.
 */
export interface Citation {
  index: number;
  documentId: number;
  documentTitle: string;
  chunkId: number;
  chunkIndex: number;
  score?: number;
  /** Populated client-side from `GET /documents/:id` when available. */
  excerpt?: string | null;
}

/** `POST /notebooks/:id/ask` */
export interface AskResponse {
  answer: string;
  sources: Citation[];
}

export type ChatRole = "user" | "assistant";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: number;
  sources?: Citation[];
  /** Set when the request failed, so the message can be retried. */
  error?: string;
}