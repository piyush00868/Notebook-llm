import type { Request} from "express";
import type { Response } from "express";
import { z } from "zod";
import { createDocument,getDocumentById } from "../services/document.service";

const createDocumentSchema = z.object({
  title: z.string().min(1),
  sourceType: z.enum(["PDF", "WEB", "YOUTUBE", "TEXT"]),
  sourceUrl: z.string().url().optional(),
  storageKey: z.string().min(1).optional(),
  status: z.enum(["PENDING", "PROCESSING", "COMPLETED", "FAILED"]),
  notebookId: z.number().int().positive(),
});

export async function createDocumentController(
  req: Request,
  res: Response
) {
  try {
    const result = createDocumentSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        error: "Invalid request data",
        details: result.error,
      });
    }

    const document = await createDocument(result.data);

    return res.status(201).json(document);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Failed to create document",
    });
  }
}

export async function getDocumentController(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        error: "Invalid document id",
      });
    }

    const document = await getDocumentById(id);

    if (!document) {
      return res.status(404).json({
        error: "Document not found",
      });
    }

    return res.status(200).json(document);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Failed to get document",
    });
  }
}