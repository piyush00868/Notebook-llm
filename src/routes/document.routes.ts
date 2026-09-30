import { Router } from "express";
import { createDocumentController, getDocumentController,deleteDocumentController } from "../controllers/document.controller";
import { requireAuth } from "../middleware/auth.middleware";
const router = Router();
router.use(requireAuth);
router.post("/", createDocumentController);
router.get("/:id", getDocumentController);
router.delete("/:id", deleteDocumentController);
export default router;