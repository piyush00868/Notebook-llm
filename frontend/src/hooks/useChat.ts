import { useCallback, useRef, useState } from "react";
import { useApi } from "@/lib/api";
import type { ChatMessage } from "@/types";

let messageCounter = 0;

function nextId(): string {
  messageCounter += 1;
  return `m${Date.now().toString(36)}-${messageCounter}`;
}

export interface ChatState {
  messages: ChatMessage[];
  /** True while an answer is being generated. */
  isAsking: boolean;
  /** Set when the last attempt failed, enabling retry. */
  error: string | null;
  ask: (question: string) => Promise<void>;
  retry: () => Promise<void>;
  stop: () => void;
  clear: () => void;
}

/**
 * Chat conversation for one notebook.
 *
 * TODO(backend): `Chat` and `ChatMessage` exist in the schema but the
 * backend exposes no read/write routes for them, so history is held in
 * memory for the session only. Add persistence once routes exist.
 */
export function useChat(notebookId: number | null): ChatState {
  const api = useApi();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isAsking, setIsAsking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  // The question behind the pending assistant message, kept so retry can
  // resend it without re-reading message state.
  const lastQuestionRef = useRef<string | null>(null);

  const ask = useCallback(
    async (question: string) => {
      const trimmed = question.trim();
      if (!trimmed || !notebookId || isAsking) return;

      lastQuestionRef.current = trimmed;
      setError(null);
      setIsAsking(true);

      const userMessage: ChatMessage = {
        id: nextId(),
        role: "user",
        content: trimmed,
        createdAt: Date.now(),
      };

      // The assistant slot is appended immediately so the thread reads as a
      // pair rather than a lone question with a spinner underneath.
      const assistantId = nextId();

      setMessages((current) => [
        ...current,
        userMessage,
        { id: assistantId, role: "assistant", content: "", createdAt: Date.now() },
      ]);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const result = await api.askNotebook(
          notebookId,
          trimmed,
          controller.signal,
        );

        setMessages((current) =>
          current.map((message) =>
            message.id === assistantId
              ? {
                  ...message,
                  content: result.answer,
                  sources: result.sources ?? [],
                }
              : message,
          ),
        );
      } catch (cause) {
        if (controller.signal.aborted) {
          // Cancelled: drop the empty assistant slot rather than leaving it.
          setMessages((current) =>
            current.filter((message) => message.id !== assistantId),
          );
          setError(null);
          return;
        }

        const message =
          cause instanceof Error
            ? cause.message
            : "We could not get an answer. Please try again.";

        setMessages((current) =>
          current.map((entry) =>
            entry.id === assistantId
              ? {
                  ...entry,
                  content: "",
                  error: message,
                }
              : entry,
          ),
        );
        setError(message);
      } finally {
        abortRef.current = null;
        setIsAsking(false);
      }
    },
    [api, isAsking, notebookId],
  );

  const retry = useCallback(async () => {
    const question = lastQuestionRef.current;
    if (!question) return;

    // Drop the failed assistant slot before resending.
    setMessages((current) => {
      const last = current[current.length - 1];
      if (last?.role === "assistant" && last.error) return current.slice(0, -1);
      return current;
    });

    await ask(question);
  }, [ask]);

  const stop = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const clear = useCallback(() => {
    abortRef.current?.abort();
    setMessages([]);
    setError(null);
    lastQuestionRef.current = null;
  }, []);

  return {
    messages,
    isAsking,
    error,
    ask,
    retry,
    stop,
    clear,
  };
}
