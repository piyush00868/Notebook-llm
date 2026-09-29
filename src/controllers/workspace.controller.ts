import type { Request } from "express";
import type { Response } from "express";
import { z } from "zod";
import { createWorkspace,getWorkspaceById } from "../services/workspace.service";

const createWorkspaceSchema = z.object({
  name: z.string().min(1),
  ownerId: z.number().int().positive(),
});

export async function createWorkspaceController(
  req: Request,
  res: Response
) {
  try {
    const result = createWorkspaceSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        error: "Invalid request data",
        details: result.error,
      });
    }

    const workspace = await createWorkspace(result.data);

    return res.status(201).json(workspace);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Failed to create workspace",
    });
  }
}

export async function getWorkspaceController(req: Request, res: Response) {
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

    return res.status(200).json(workspace);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Failed to get workspace",
    });
  }
}