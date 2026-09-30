import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import { getCurrentUserController } from "../controllers/user.controller";

const router = Router();

router.use(requireAuth);

router.get("/me", getCurrentUserController);

export default router;