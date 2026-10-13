import { Router } from "express";
import { createDocumentController, getDocumentController,deleteDocumentController,uploadPdfController, chunkDocumentController, askDocumentController,uploadUrlController,uploadYoutubeController,uploadTextController } from "../controllers/document.controller";
import { requireAuth } from "../middleware/auth.middleware";
import { uploadPdf } from "../middleware/upload.middleware";
const router = Router();
router.use(requireAuth);
router.post("/", createDocumentController);
router.get("/:id", getDocumentController);
router.post("/upload", uploadPdf.single("file"), uploadPdfController);
router.delete("/:id", deleteDocumentController);
router.post("/:id/chunks", chunkDocumentController);
router.post("/:id/ask", askDocumentController);
router.post("/youtube", uploadYoutubeController);
router.post("/url", uploadUrlController);
// Registered before "/:id" style routes for readability; single-segment path,
// so it cannot collide with "/:id/chunks".
router.post("/text", uploadTextController);
export default router;