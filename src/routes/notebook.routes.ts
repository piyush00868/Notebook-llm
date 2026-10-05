import { Router } from "express";
import { askNotebookController, createNotebookController, getNotebookController } from "../controllers/notebook.controller";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

router.use(requireAuth);
router.post("/", createNotebookController);
router.get("/:id", getNotebookController);
router.post("/:id/ask", askNotebookController);
export default router;