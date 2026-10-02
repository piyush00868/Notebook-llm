import type { Request} from "express";
import type { Response } from "express";
import { z } from "zod";
import { getAuth } from "@clerk/express";
import { getNotebookById } from "../services/notebook.service";
import { extractPdfText } from "../services/ingestion/pdf.service";
import { normalizeText } from "../services/ingestion/text.service";
import { createDocumentChunks } from "../services/ingestion/chunk.service";
import { assertOwner } from "../services/authorization.service";
import {
  createDocument,
  getDocumentById,
  deleteDocument,
} from "../services/document.service";
const createDocumentSchema = z.object({
  title: z.string().min(1),
  sourceType: z.enum(["PDF", "WEB", "YOUTUBE", "TEXT"]),
  sourceUrl: z.string().url().optional(),
  storageKey: z.string().min(1).optional(),
  content: z.string().optional(),
  status: z.enum(["PENDING", "PROCESSING", "COMPLETED", "FAILED"]),
  notebookId: z.number().int().positive(),
}).superRefine((data, ctx) => {
  if (data.sourceType === "TEXT" && !data.content?.trim()) {
    ctx.addIssue({
      code: "custom",
      path: ["content"],
      message: "Content is required for TEXT documents",
    });
  }
}); 
export async function createDocumentController(
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

    const result = createDocumentSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        error: "Invalid request data",
        details: result.error,
      });
    }

    const notebook = await getNotebookById(result.data.notebookId);

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
        error: "Invalid document id",
      });
    }

    const document = await getDocumentById(id);

    if (!document) {
      return res.status(404).json({
        error: "Document not found",
      });
    }
    if (!document.notebook) {
  return res.status(500).json({
    error: "Document notebook not found",
  });
}

if (!document.notebook.workspace) {
  return res.status(500).json({
    error: "Document workspace not found",
  });
}

try {
  assertOwner(document.notebook.workspace.owner.clerkUserId, userId);
} catch {
  return res.status(403).json({
    error: "Forbidden",
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

export async function deleteDocumentController(
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
        error: "Invalid document id",
      });
    }

    const document = await getDocumentById(id);

    if (!document) {
      return res.status(404).json({
        error: "Document not found",
      });
    }

    if (!document.notebook) {
      return res.status(500).json({
        error: "Document notebook not found",
      });
    }

    if (!document.notebook.workspace) {
      return res.status(500).json({
        error: "Document workspace not found",
      });
    }

    try {
      assertOwner(
        document.notebook.workspace.owner.clerkUserId,
        userId,
      );
    } catch {
      return res.status(403).json({
        error: "Forbidden",
      });
    }

    await deleteDocument(id);

    return res.status(204).send();
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Failed to delete document",
    });
  }
}

export async function uploadPdfController(
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
    if (!req.file) {
      return res.status(400).json({
        error: "PDF file is required",
      });
    }

    const notebookId = Number(req.body.notebookId);
    const title = String(req.body.title ?? "").trim();

    if (!Number.isInteger(notebookId) || notebookId <= 0) {
      return res.status(400).json({
        error: "Invalid notebookId",
      });
    }

    if (!title) {
      return res.status(400).json({
        error: "Title is required",
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

    const extractedText = await extractPdfText(req.file.buffer);
    const content = normalizeText(extractedText);

    if (!content) {
      return res.status(400).json({
        error: "Could not extract text from PDF",
      });
    }

    const document = await createDocument({
      title,
      sourceType: "PDF",
      content,
      status: "COMPLETED",
      notebookId,
    });

    return res.status(201).json(document);
  } catch (error) {
    console.error("PDF INGESTION ERROR:", error);

    if (
      error instanceof Error &&
      error.name === "PasswordException"
    ) {
      return res.status(400).json({
        error: "Password-protected PDFs are not supported",
      });
    }

    return res.status(500).json({
      error: "Failed to ingest PDF",
    });
  }
}

export async function chunkDocumentController(
  req: Request,
  res: Response,
) {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        error: "Invalid document id",
      });
    }

    const chunks = await createDocumentChunks(id);

    return res.status(201).json({
      documentId: id,
      chunkCount: chunks.length,
      chunks,
    });
  } catch (error) {
    console.error("CHUNKING ERROR:", error);

    return res.status(500).json({
      error: "Failed to chunk document",
    });
  }
}