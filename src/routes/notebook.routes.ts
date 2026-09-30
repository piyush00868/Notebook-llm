import { Router } from "express";
import { createNotebookController, getNotebookController } from "../controllers/notebook.controller";
import { requireAuth } from "../middleware/auth.middleware";
const router = Router();

router.use(requireAuth);
router.post("/", createNotebookController);
router.get("/:id", getNotebookController);
export default router;