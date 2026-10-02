import { Router } from "express";
import { createWorkspaceController, getWorkspaceController,deleteWorkspaceController } from "../controllers/workspace.controller";
import { requireAuth } from "../middleware/auth.middleware";
const router = Router();
router.use(requireAuth);
router.post("/", createWorkspaceController);
router.get("/:id", getWorkspaceController);
router.delete("/:id", deleteWorkspaceController);
export default router;