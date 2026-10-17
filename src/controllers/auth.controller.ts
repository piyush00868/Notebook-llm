import type { Request, Response } from "express";
import { getAuth } from "@clerk/express";
import {
  buildConsentUrl,
  clearRefreshToken,
  createState,
  exchangeCodeForRefreshToken,
  hasRefreshToken,
  isYouTubeOAuthConfigured,
  saveRefreshToken,
  verifyState,
} from "../services/youtube-oauth.service";

/**
 * Where the browser lands once Google has done its part.
 *
 * Overridable so a local run can bounce back to a local frontend, while the
 * deployed default points at the production site.
 */
function frontendUrl(path: string): string {
  const base =
    process.env.FRONTEND_URL ?? "https://mindorafrontend.vercel.app";
  return new URL(path, base).toString();
}

/**
 * Step 1: bounce the user to Google's consent screen.
 *
 * The signed state carries the Clerk user id because the callback lands on the
 * API domain, where no Clerk session cookie exists to read.
 */
export async function startYouTubeAuth(req: Request, res: Response) {
  const { userId } = getAuth(req);

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (!isYouTubeOAuthConfigured()) {
    return res.status(501).json({
      error:
        "YouTube connections are not configured on this server. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET and GOOGLE_REDIRECT_URI.",
    });
  }

  /*
   * The URL is returned rather than redirected to.
   *
   * The API authenticates from an `Authorization` header, and Clerk's session
   * cookie is scoped to the frontend domain, so a browser navigating here
   * directly arrives with neither and is rejected. The client fetches this
   * first and then navigates to the returned URL.
   */
  return res.status(200).json({ url: buildConsentUrl(createState(userId)) });
}

/**
 * Step 2: Google redirects back with an authorisation code.
 *
 * Unauthenticated by necessity -- the browser arrives here from Google, so
 * there is no Clerk cookie. Identity comes from the signed state instead.
 */
export async function youTubeAuthCallback(req: Request, res: Response) {
  const code = typeof req.query.code === "string" ? req.query.code : null;
  const state = typeof req.query.state === "string" ? req.query.state : null;

  if (!code || !state) {
    return res.redirect(
      frontendUrl("/workspace?youtube=error&reason=missing-parameters"),
    );
  }

  const verified = verifyState(state);

  if (!verified.ok) {
  if (!verified.ok) {
    return res.redirect(
      frontendUrl(`/workspace?youtube=error&reason=${encodeURIComponent(verified.reason)}`),
    );
  }
  }

  try {
    const refreshToken = await exchangeCodeForRefreshToken(
      code,
      verified.clerkUserId,
    );

    await saveRefreshToken(verified.clerkUserId, refreshToken);

    return res.redirect(frontendUrl("/workspace?youtube=connected"));
  } catch (error) {
    console.error("YOUTUBE OAUTH ERROR:", error);

    return res.redirect(frontendUrl(`/workspace?youtube=error&reason=${encodeURIComponent("Could not complete the Google authorisation.")}`));
  }
}

/** Whether the signed-in user can add YouTube sources right now. */
export async function youTubeAuthStatus(req: Request, res: Response) {
  const { userId } = getAuth(req);

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  return res.status(200).json({
    configured: isYouTubeOAuthConfigured(),
    connected: await hasRefreshToken(userId),
  });
}

/** Disconnects the account by discarding the stored refresh token. */
export async function disconnectYouTube(req: Request, res: Response) {
  const { userId } = getAuth(req);

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  await clearRefreshToken(userId);

  return res.status(200).json({ connected: false });
}
