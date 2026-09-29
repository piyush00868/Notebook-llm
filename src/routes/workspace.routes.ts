import { Router } from "express";
import { createWorkspaceController, getWorkspaceController } from "../controllers/workspace.controller";

const router = Router();

router.post("/", createWorkspaceController);
router.get("/:id", getWorkspaceController);

export default router;