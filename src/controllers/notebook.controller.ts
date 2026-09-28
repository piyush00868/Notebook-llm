import type { Request } from "express";
import type { Response } from "express";
import { z } from "zod";
import { createNotebook } from "../services/notebook.service";

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