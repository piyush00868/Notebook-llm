import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { ApiError, useApi } from "@/lib/api";
import type { Notebook, User, Workspace } from "@/types";

const STORAGE_KEY = "mindora:workspace-id";

function readStoredWorkspaceId(): number | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const id = Number(raw);
    return Number.isInteger(id) && id > 0 ? id : null;
  } catch {
    return null;
  }
}

function writeStoredWorkspaceId(id: number) {
  try {
    window.localStorage.setItem(STORAGE_KEY, String(id));
  } catch {
    // Storage may be unavailable (private mode). The workspace still works
    // for this session, it just won't be remembered.
  }
}

interface LoadState {
  key: number;
  user: User | null;
  workspace: Workspace | null;
  error: string | null;
}

export interface WorkspaceState {
  user: User | null;
  workspace: Workspace | null;
  notebooks: Notebook[];
  isInitialLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  refresh: () => void;
  createNotebook: (name: string) => Promise<Notebook>;
  deleteNotebook: (id: number) => Promise<void>;
}

/**
 * Resolves the signed-in user's workspace and its notebooks.
 *
 * The backend exposes `POST /workspaces` and `GET /workspaces/:id` but no
 * list endpoint, so the created workspace id is cached per browser.
 * TODO(backend): add `GET /workspaces` returning the caller's workspaces so
 * this hook can drop the local-storage cache entirely.
 */
export function useWorkspace(): WorkspaceState {
  const api = useApi();

  const [requestKey, setRequestKey] = useState(0);
  const [state, setState] = useState<LoadState>({
    key: -1,
    user: null,
    workspace: null,
    error: null,
  });

  useEffect(() => {
    const key = requestKey;
    let active = true;

    async function load() {
      try {
        const currentUser = await api.getCurrentUser();
        if (!active) return;

        const storedId = readStoredWorkspaceId();

        let resolved: Workspace | null = null;
        if (storedId) {
          try {
            resolved = await api.getWorkspace(storedId);
          } catch (cause) {
            // The cached workspace is gone or no longer ours — start fresh.
            if (
              !(cause instanceof ApiError) ||
              (cause.status !== 404 && cause.status !== 403)
            ) {
              throw cause;
            }
            resolved = null;
          }
        }

        if (!resolved) {
          const label = currentUser.name
            ? `${currentUser.name}'s workspace`
            : "My workspace";
          resolved = await api.createWorkspace(label);
          writeStoredWorkspaceId(resolved.id);

          if (active) {
            toast.success("Workspace created", {
              description: "A private knowledge space is ready for you.",
            });
          }
        }

        if (!active) return;
        setState({ key, user: currentUser, workspace: resolved, error: null });
      } catch (cause) {
        if (!active) return;
        setState((current) =>
          current.key === key
            ? current
            : {
                key,
                user: null,
                workspace: null,
                error:
                  cause instanceof Error
                    ? cause.message
                    : "We could not load your workspace.",
              },
        );
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [api, requestKey]);

  const settled = state.key === requestKey;
  const user = settled ? state.user : null;
  const workspace = settled ? state.workspace : null;
  const error = settled ? state.error : null;

  // A settled error is terminal for that key; otherwise we are waiting.
  const isInitialLoading = !settled || (!workspace && !error);
  const isRefreshing = settled && workspace !== null && !error;

  const refresh = useCallback(() => setRequestKey((value) => value + 1), []);

  const createNotebook = useCallback(
    async (name: string) => {
      if (!workspace) {
        throw new Error("Your workspace is still loading. Try again in a moment.");
      }

      const notebook = await api.createNotebook({
        name,
        workspaceId: workspace.id,
      });

      setState((current) =>
        current.workspace
          ? {
              ...current,
              workspace: {
                ...current.workspace,
                notebooks: [notebook, ...current.workspace.notebooks],
              },
            }
          : current,
      );

      return notebook;
    },
    [api, workspace],
  );

  const deleteNotebook = useCallback(async (id: number) => {
    await api.deleteNotebook(id);
    setState((current) =>
      current.workspace
        ? {
            ...current,
            workspace: {
              ...current.workspace,
              notebooks: current.workspace.notebooks.filter(
                (notebook) => notebook.id !== id,
              ),
            },
          }
        : current,
    );
  }, [api]);

  return {
    user,
    workspace,
    notebooks: workspace?.notebooks ?? [],
    isInitialLoading,
    isRefreshing,
    error,
    refresh,
    createNotebook,
    deleteNotebook,
  };
}