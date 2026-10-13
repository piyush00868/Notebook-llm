import { Router } from "express";
import { createWorkspaceController, getWorkspaceController,deleteWorkspaceController,listWorkspacesController } from "../controllers/workspace.controller";
import { requireAuth } from "../middleware/auth.middleware";
const router = Router();
router.use(requireAuth);
router.post("/", createWorkspaceController);
// Registered before "/:id" so the list route is matched first.
router.get("/", listWorkspacesController);
router.get("/:id", getWorkspaceController);
router.delete("/:id", deleteWorkspaceController);
export default router;