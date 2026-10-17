import { Router } from "express";
import {
  disconnectYouTube,
  startYouTubeAuth,
  youTubeAuthCallback,
  youTubeAuthStatus,
} from "../controllers/auth.controller";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

/*
 * Google's redirect lands here from outside the app, so this is deliberately
 * NOT behind requireAuth -- the browser has no Clerk session cookie on the API
 * domain. Identity is carried by the HMAC-signed `state` instead, which is
 * verified in the controller.
 */
router.get("/youtube/callback", youTubeAuthCallback);

router.get("/youtube", requireAuth, startYouTubeAuth);
router.get("/youtube/status", requireAuth, youTubeAuthStatus);
router.delete("/youtube", requireAuth, disconnectYouTube);

export default router;