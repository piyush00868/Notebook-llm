import { Router } from "express";
import { askNotebookController, createNotebookController, getNotebookController,deleteNotebookController } from "../controllers/notebook.controller";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

router.use(requireAuth);
router.post("/", createNotebookController);
router.get("/:id", getNotebookController);
router.post("/:id/ask", askNotebookController);
router.delete("/:id", deleteNotebookController);
export default router;