import { Router } from "express";
import { createNotebookController, getNotebookController } from "../controllers/notebook.controller";

const router = Router();

router.post("/", createNotebookController);
router.get("/:id", getNotebookController);
export default router;