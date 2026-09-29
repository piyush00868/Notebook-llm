import { Router } from "express";
import { createDocumentController, getDocumentController } from "../controllers/document.controller";

const router = Router();

router.post("/", createDocumentController);
router.get("/:id", getDocumentController);
export default router;