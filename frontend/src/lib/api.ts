import { useAuth } from "@clerk/clerk-react";
import { useMemo } from "react";
import type {
  AskResponse,
  DocumentSource,
  Notebook,
  User,
  Workspace,
} from "@/types";

/**
 * Backend base URL.
 *
 * The Express server defaults to PORT=4000. Override per environment with
 * `VITE_API_URL` (see `.env`). No backend change is required for this.
 */
const API_BASE_URL = (
  import.meta.env.VITE_API_URL ?? "http://localhost:4000"
).replace(/\/+$/, "");

/** Error carrying the HTTP status so callers can branch on 401/404/etc. */
export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

type RequestOptions = {
  method?: "GET" | "POST" | "DELETE";
  body?: unknown;
  /** Pre-built body (e.g. FormData) — skips JSON serialisation. */
  rawBody?: BodyInit;
  signal?: AbortSignal;
};

type TokenGetter = () => Promise<string | null>;

/**
 * Single authenticated transport for the whole app.
 *
 * Components never call `fetch` directly. Auth uses the active Clerk
 * session token via `getToken()`; tokens are never hardcoded or persisted.
 */
export function createApiClient(getToken: TokenGetter) {
  async function request<T>(path: string, options: RequestOptions = {}) {
    const token = await getToken();

    const headers: Record<string, string> = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    let body: BodyInit | undefined = options.rawBody;
    if (body === undefined && options.body !== undefined) {
      headers["Content-Type"] = "application/json";
      body = JSON.stringify(options.body);
    }

    let response: Response;
    try {
      response = await fetch(`${API_BASE_URL}${path}`, {
        method: options.method ?? "GET",
        headers,
        body,
        signal: options.signal,
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        throw error;
      }
      throw new ApiError(
        "Could not reach the server. Check your connection and try again.",
        0,
      );
    }

    if (response.status === 204) {
      return undefined as T;
    }

    const isJson = response.headers
      .get("content-type")
      ?.includes("application/json");

    const payload = isJson ? await response.json() : await response.text();

    if (!response.ok) {
      const message =
        (isJson && payload && typeof payload === "object" && "error" in payload
          ? String((payload as { error: unknown }).error)
          : null) ??
        (typeof payload === "string" && payload
          ? payload
          : `Request failed (${response.status})`);
      throw new ApiError(message, response.status);
    }

    return payload as T;
  }

  return {
    /** Current user, synchronised server-side on first call. */
    getCurrentUser: (signal?: AbortSignal) =>
      request<User>("/users/me", { signal }),

    /**
     * TODO(backend): there is no `GET /workspaces` (list) endpoint. The
     * frontend works around this by remembering the created workspace id
     * and re-fetching it by id, creating one on first run. A list
     * endpoint would remove the local-storage dependency.
     */
    createWorkspace: (name: string) =>
      request<Workspace>("/workspaces", {
        method: "POST",
        body: { name },
      }),

    getWorkspace: (id: number, signal?: AbortSignal) =>
      request<Workspace>(`/workspaces/${id}`, { signal }),

    deleteWorkspace: (id: number) =>
      request<{ message: string }>(`/workspaces/${id}`, { method: "DELETE" }),

    createNotebook: (input: { name: string; workspaceId: number }) =>
      request<Notebook>("/notebooks", { method: "POST", body: input }),

    getNotebook: (id: number, signal?: AbortSignal) =>
      request<Notebook>(`/notebooks/${id}`, { signal }),

    deleteNotebook: (id: number) =>
      request<{ message: string }>(`/notebooks/${id}`, { method: "DELETE" }),

    askNotebook: (
      notebookId: number,
      question: string,
      signal?: AbortSignal,
    ) =>
      request<AskResponse>(`/notebooks/${notebookId}/ask`, {
        method: "POST",
        body: { question },
        signal,
      }),

    getDocument: (id: number, signal?: AbortSignal) =>
      request<DocumentSource>(`/documents/${id}`, { signal }),

    deleteDocument: (id: number) =>
      request<void>(`/documents/${id}`, { method: "DELETE" }),

    /** PDF / TXT upload. The backend accepts PDF only (`upload.middleware`). */
    uploadDocument: (input: {
      notebookId: number;
      title: string;
      file: File;
    }) => {
      const form = new FormData();
      form.append("notebookId", String(input.notebookId));
      form.append("title", input.title);
      form.append("file", input.file);

      return request<{ message: string; document: DocumentSource }>(
        "/documents/upload",
        { method: "POST", rawBody: form },
      );
    },

    addWebsiteSource: (input: {
      notebookId: number;
      title: string;
      url: string;
    }) => request<DocumentSource>("/documents/url", { method: "POST", body: input }),

    addYoutubeSource: (input: {
      notebookId: number;
      title: string;
      url: string;
    }) =>
      request<DocumentSource>("/documents/youtube", {
        method: "POST",
        body: input,
      }),

    /**
     * Pasted text. The backend validates `content` for TEXT sources but
     * does not chunk or embed them, so the source is created and then
     * chunked through the public `/documents/:id/chunks` route.
     *
     * TODO(backend): paste-text sources have no dedicated ingestion route
     * with embedding. Until one exists, text is chunked client-side via
     * the existing chunks endpoint.
     */
    createTextSource: (input: {
      notebookId: number;
      title: string;
      content: string;
    }) =>
      request<DocumentSource>("/documents", {
        method: "POST",
        body: {
          title: input.title,
          sourceType: "TEXT",
          content: input.content,
          status: "COMPLETED",
          notebookId: input.notebookId,
        },
      }),

    chunkDocument: (id: number) =>
      request<{ documentId: number; chunkCount: number }>(
        `/documents/${id}/chunks`,
        { method: "POST" },
      ),
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;

/**
 * Client bound to the active Clerk session.
 *
 * `getToken` from Clerk is stable for a session, so memoising on it gives
 * every hook in the tree one shared client and rebuilds on sign-in/out.
 */
export function useApi(): ApiClient {
  const { getToken } = useAuth();

  return useMemo(() => createApiClient(() => getToken()), [getToken]);
}

export { API_BASE_URL };