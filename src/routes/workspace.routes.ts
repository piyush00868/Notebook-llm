import { Router } from "express";
import { createWorkspaceController } from "../controllers/workspace.controller";

const router = Router();

router.post("/", createWorkspaceController);

export default router;