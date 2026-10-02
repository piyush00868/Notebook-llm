import type { Request, Response } from "express";
import { z } from "zod";
import { getAuth } from "@clerk/express";
import { assertOwner } from "../services/authorization.service";
import {
  createWorkspace,
  getWorkspaceById,
  deleteWorkspace
} from "../services/workspace.service";
import { syncCurrentUser } from "../services/auth.service";

const createWorkspaceSchema = z.object({
  name: z.string().min(1),
});

export async function createWorkspaceController(req: Request, res: Response) {
  try {
    const { userId } = getAuth(req);

    if (!userId) {
      return res.status(401).json({
        error: "Unauthorized",
      });
    }

    const result = createWorkspaceSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        error: "Invalid request data",
        details: result.error,
      });
    }

const user = await syncCurrentUser(userId);

if (!user) {
  return res.status(500).json({
    error: "Failed to synchronize user",
  });
}

const workspace = await createWorkspace({
  name: result.data.name,
  ownerId: user.id,
});

    return res.status(201).json(workspace);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Failed to create workspace",
    });
  }
}

export async function getWorkspaceController(req: Request, res: Response) {
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
        error: "Invalid workspace id",
      });
    }

    const workspace = await getWorkspaceById(id);

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

    return res.status(200).json(workspace);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Failed to get workspace",
    });
  }
}

export async function deleteWorkspaceController(
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
        error: "Invalid workspace id",
      });
    }

    const workspace = await getWorkspaceById(id);

    if (!workspace) {
      return res.status(404).json({
        error: "Workspace not found",
      });
    }

    if (!workspace.owner) {
      return res.status(500).json({
        error: "Workspace owner not found",
      });
    }

    if (workspace.owner.clerkUserId !== userId) {
      return res.status(403).json({
        error: "Forbidden",
      });
    }

    await deleteWorkspace(id);

    return res.status(204).send();
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Failed to delete workspace",
    });
  }
}