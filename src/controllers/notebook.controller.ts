import type { Request } from "express";
import type { Response } from "express";
import { z } from "zod";
import { createNotebook, getNotebookById,deleteNotebook } from "../services/notebook.service";
import { getAuth } from "@clerk/express";
import { getWorkspaceById } from "../services/workspace.service";
import { answerQuestion } from "../services/RAG/rag.service";
import { assertOwner } from "../services/authorization.service";

const createNotebookSchema = z.object({
  name: z.string().min(1),
  workspaceId: z.number().int().positive(),
});

export async function createNotebookController(
  req: Request,
  res: Response,
) {
  try {
    const { userId } = getAuth(req);

    if (!userId) {
      return res.status(401).json({
        error: "Unauthorized",
      });
    }

    const result = createNotebookSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        error: "Invalid request data",
        details: result.error,
      });
    }

    const workspace = await getWorkspaceById(result.data.workspaceId);

    if (!workspace) {
      return res.status(404).json({
        error: "Workspace not found",
      });
    }

try {
  assertOwner(workspace.owner.clerkUserId, userId);
} catch {
  return res.status(403).json({
    error: "Forbidden",
  });
}

    const notebook = await createNotebook(result.data);

    return res.status(201).json(notebook);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Failed to create notebook",
    });
  }
}
export async function getNotebookController(req: Request, res: Response) {
  const { userId } = getAuth(req);

  if (!userId) {
    return res.status(401).json({
      error: "Unauthorized",
    });
  }

  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        error: "Invalid notebook id",
      });
    }

    const notebook = await getNotebookById(id);

    if (!notebook) {
      return res.status(404).json({
        error: "Notebook not found",
      });
    }
    if (!notebook.workspace) {
      return res.status(500).json({
        error: "Notebook workspace not found",
      });
    }

try {
  assertOwner(notebook.workspace.owner.clerkUserId, userId);
} catch {
  return res.status(403).json({
    error: "Forbidden",
  });
}

    return res.status(200).json(notebook);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Failed to get notebook",
    });
  }
}

export async function askNotebookController(
  req: Request,
  res: Response,
) {
  const { userId } = getAuth(req);

  if (!userId) {
    return res.status(401).json({
      error: "Unauthorized",
    });
  }

  try {
    const notebookId = Number(req.params.id);

    if (!Number.isInteger(notebookId) || notebookId <= 0) {
      return res.status(400).json({
        error: "Invalid notebook id",
      });
    }

    const question = String(req.body.question ?? "").trim();

    if (!question) {
      return res.status(400).json({
        error: "Question is required",
      });
    }

    const notebook = await getNotebookById(notebookId);

    if (!notebook) {
      return res.status(404).json({
        error: "Notebook not found",
      });
    }

    if (!notebook.workspace) {
      return res.status(500).json({
        error: "Notebook workspace not found",
      });
    }

    try {
      assertOwner(
        notebook.workspace.owner.clerkUserId,
        userId,
      );
    } catch {
      return res.status(403).json({
        error: "Forbidden",
      });
    }

    const result = await answerQuestion(
      question,
      notebookId,
      5,
    );

    return res.status(200).json(result);
  } catch (error) {
    console.error("NOTEBOOK RAG ERROR:", error);

    return res.status(500).json({
      error: "Failed to answer question",
    });
  }
}

export async function deleteNotebookController(
  req: Request,
  res: Response,
) {
  const { userId } = getAuth(req);

  if (!userId) {
    return res.status(401).json({
      error: "Unauthorized",
    });
  }

  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        error: "Invalid notebook id",
      });
    }

    const notebook = await getNotebookById(id);

    if (!notebook) {
      return res.status(404).json({
        error: "Notebook not found",
      });
    }

    if (!notebook.workspace) {
      return res.status(500).json({
        error: "Notebook workspace not found",
      });
    }

    try {
      assertOwner(
        notebook.workspace.owner.clerkUserId,
        userId,
      );
    } catch {
      return res.status(403).json({
        error: "Forbidden",
      });
    }

    const deletedNotebook = await deleteNotebook(id);

    if (!deletedNotebook) {
      return res.status(404).json({
        error: "Notebook not found",
      });
    }

    return res.status(200).json({
      message: "Notebook deleted successfully",
      notebook: deletedNotebook,
    });
  } catch (error) {
    console.error("DELETE NOTEBOOK ERROR:", error);

    return res.status(500).json({
      error: "Failed to delete notebook",
    });
  }
}