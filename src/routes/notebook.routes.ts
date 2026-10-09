import { Router } from "express";
import { askNotebookController, createNotebookController, getNotebookController,deleteNotebookController } from "../controllers/notebook.controller";
import { requireAuth } from "../middleware/auth.middleware";
import {
  createChatController,
  listChatsController,
} from "../controllers/chat.controller";

const router = Router();

router.use(requireAuth);
router.post("/", createNotebookController);
router.get("/:id", getNotebookController);
router.post("/:id/ask", askNotebookController);
router.delete("/:id", deleteNotebookController);
router.post("/:id/chats", createChatController);
router.get("/:id/chats", listChatsController);
export default router;