import { Router } from "express";
import { createNotebookController } from "../controllers/notebook.controller";

const router = Router();

router.post("/", createNotebookController);

export default router;