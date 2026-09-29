import type { Request } from "express";
import type { Response } from "express";
import { z } from "zod";
import { createNotebook, getNotebookById } from "../services/notebook.service";

const createNotebookSchema = z.object({
  name: z.string().min(1),
  workspaceId: z.number().int().positive(),
});

export async function createNotebookController(
  req: Request,
  res: Response
) {
  try {
    const result = createNotebookSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        error: "Invalid request data",
        details: result.error,
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

    return res.status(200).json(notebook);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Failed to get notebook",
    });
  }
}

