import type { Request, Response } from "express";
import { getAuth } from "@clerk/express";
import {
  createChat,
  getChatsByNotebookId,
} from "../services/chat.service";
import { getNotebookById } from "../services/notebook.service";
import { assertOwner } from "../services/authorization.service";

export async function createChatController(
  req: Request,
  res: Response,
) {
  const { userId } = getAuth(req);

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const notebookId = Number(req.params.id);

    if (!Number.isInteger(notebookId) || notebookId <= 0) {
      return res.status(400).json({ error: "Invalid notebook id" });
    }

    const notebook = await getNotebookById(notebookId);

    if (!notebook) {
      return res.status(404).json({ error: "Notebook not found" });
    }

    if (!notebook.workspace) {
      return res.status(500).json({ error: "Notebook workspace not found" });
    }

    try {
      assertOwner(notebook.workspace.owner.clerkUserId, userId);
    } catch {
      return res.status(403).json({ error: "Forbidden" });
    }

    const chat = await createChat(notebookId);

    return res.status(201).json(chat);
  } catch (error) {
    console.error("CREATE CHAT ERROR:", error);
    return res.status(500).json({ error: "Failed to create chat" });
  }
}

export async function listChatsController(
  req: Request,
  res: Response,
) {
  const { userId } = getAuth(req);

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const notebookId = Number(req.params.id);

    if (!Number.isInteger(notebookId) || notebookId <= 0) {
      return res.status(400).json({ error: "Invalid notebook id" });
    }

    const notebook = await getNotebookById(notebookId);

    if (!notebook) {
      return res.status(404).json({ error: "Notebook not found" });
    }

    if (!notebook.workspace) {
      return res.status(500).json({ error: "Notebook workspace not found" });
    }

    try {
      assertOwner(notebook.workspace.owner.clerkUserId, userId);
    } catch {
      return res.status(403).json({ error: "Forbidden" });
    }

    const chats = await getChatsByNotebookId(notebookId);

    return res.status(200).json(chats);
  } catch (error) {
    console.error("LIST CHATS ERROR:", error);
    return res.status(500).json({ error: "Failed to list chats" });
  }
}
