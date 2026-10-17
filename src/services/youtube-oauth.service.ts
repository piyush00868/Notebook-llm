import { clerkClient } from "@clerk/express";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * Google OAuth for YouTube caption downloads.
 *
 * Why this exists: `youtube-transcript` scrapes the HTML watch page, which
 * works from a residential IP and fails from a datacenter one -- YouTube
 * answers Render with a consent page, the parser finds no caption tracks, and
 * it reports "transcript is disabled" for a video that has captions.
 *
 * The official alternative needs a credential that "asserts a principal".
 * `captions.download` rejects API keys outright:
 *
 *   "API keys are not supported by this API. Expected OAuth2 access token..."
 *
 * So the user authorises their Google account once and we keep the refresh
 * token in Clerk's backend-only private metadata.
 *
 * NOTE: token storage here is a consequence of not being able to add a table.
 * Clerk private metadata is never exposed to the browser, but a dedicated
 * table would be the better long-term home.
 */

const AUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";

/** Read captions on the user's behalf. */
const SCOPE = "https://www.googleapis.com/auth/youtube.force-ssl";

/** Guards against a replayed or forged callback. */
const STATE_TTL_MS = 10 * 60 * 1000;

/** Key inside Clerk's private metadata object. */
const METADATA_KEY = "youtubeRefreshToken";

function required(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(
      `${name} is not configured. Set it to complete YouTube OAuth.`,
    );
  }

  return value;
}

export function isYouTubeOAuthConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID &&
      process.env.GOOGLE_CLIENT_SECRET &&
      process.env.GOOGLE_REDIRECT_URI,
  );
}

function clientId(): string {
  return required("GOOGLE_CLIENT_ID");
}

function clientSecret(): string {
  return required("GOOGLE_CLIENT_SECRET");
}

export function redirectUri(): string {
  return required("GOOGLE_REDIRECT_URI");
}

/**
 * Signs the callback state.
 *
 * The user id travels inside the state rather than being read from a session
 * cookie, because Google's redirect lands on the API domain where the browser
 * has no Clerk session cookie to read.
 */
function sign(payload: string): string {
  return createHmac("sha256", clientSecret())
    .update(payload)
    .digest("base64url");
}

export function createState(clerkUserId: string): string {
  const payload = Buffer.from(
    JSON.stringify({
      userId: clerkUserId,
      nonce: randomBytes(16).toString("base64url"),
      issuedAt: Date.now(),
    }),
  ).toString("base64url");

  return `${payload}.${sign(payload)}`;
}

export type StateResult =
  | { ok: true; clerkUserId: string }
  | { ok: false; reason: string };

/** Verifies signature and age before trusting anything in the state. */
export function verifyState(state: string): StateResult {
  const [payload, signature] = state.split(".");

  if (!payload || !signature) {
    return { ok: false, reason: "Malformed OAuth state." };
  }

  const expected = sign(payload);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);

  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return { ok: false, reason: "OAuth state signature did not match." };
  }

  try {
    const decoded = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    ) as { userId?: string; issuedAt?: number };

    if (typeof decoded.userId !== "string" || !decoded.userId) {
      return { ok: false, reason: "OAuth state is missing a user." };
    }

    if (
      typeof decoded.issuedAt !== "number" ||
      Date.now() - decoded.issuedAt > STATE_TTL_MS
    ) {
      return { ok: false, reason: "OAuth state has expired." };
    }

    return { ok: true, clerkUserId: decoded.userId };
  } catch {
    return { ok: false, reason: "OAuth state could not be decoded." };
  }
}

export function buildConsentUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: clientId(),
    redirect_uri: redirectUri(),
    response_type: "code",
    scope: SCOPE,
    state,
    // Forces the consent screen so a refresh token is actually issued.
    access_type: "offline",
    prompt: "consent",
  });

  return `${AUTH_ENDPOINT}?${params.toString()}`;
}

type TokenResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  error?: string;
  error_description?: string;
};

async function requestToken(body: Record<string, string>) {
  const response = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(body).toString(),
  });

  const payload = (await response.json()) as TokenResponse;

  if (!response.ok) {
    throw new Error(
      payload.error_description || payload.error || "Token request failed",
    );
  }

  return payload;
}

/**
 * Exchanges the authorisation code for tokens.
 *
 * A refresh token is only returned on the first consent, so an existing one
 * is never overwritten with `undefined` on a later re-authorisation.
 */
export async function exchangeCodeForRefreshToken(
  code: string,
  clerkUserId: string,
): Promise<string> {
  const tokens = await requestToken({
    code,
    client_id: clientId(),
    client_secret: clientSecret(),
    redirect_uri: redirectUri(),
    grant_type: "authorization_code",
  });

  if (tokens.refresh_token) {
    return tokens.refresh_token;
  }

  // Google only issues a refresh token on the first consent, so a repeat
  // authorisation returns none. Keep whatever is already stored.
  const user = await clerkClient.users.getUser(clerkUserId);
  const existing = (user.privateMetadata as Record<string, string> | undefined)?.[
    METADATA_KEY
  ];

  if (existing) {
    return existing;
  }

  throw new Error(
    "Google did not return a refresh token. Revoke the app's access and reconnect.",
  );
}

export async function saveRefreshToken(
  clerkUserId: string,
  refreshToken: string,
): Promise<void> {
  await clerkClient.users.updateUserMetadata(clerkUserId, {
    privateMetadata: { [METADATA_KEY]: refreshToken },
  });
}

export async function clearRefreshToken(clerkUserId: string): Promise<void> {
  await clerkClient.users.updateUserMetadata(clerkUserId, {
    // An explicit empty string removes the key rather than storing a blank.
    privateMetadata: { [METADATA_KEY]: "" },
  });
}

export async function hasRefreshToken(
  clerkUserId: string,
): Promise<boolean> {
  try {
    const user = await clerkClient.users.getUser(clerkUserId);

    return Boolean(
      (user.privateMetadata as Record<string, string> | undefined)?.[
        METADATA_KEY
      ],
    );
  } catch {
    return false;
  }
}

/** Returns a usable access token, refreshing from the stored refresh token. */
export async function getAccessToken(clerkUserId: string): Promise<string> {
  const user = await clerkClient.users.getUser(clerkUserId);
  const refreshToken = (user.privateMetadata as Record<string, string> | undefined)?.[
    METADATA_KEY
  ];

  if (!refreshToken) {
    throw new YouTubeNotConnectedError();
  }

  const tokens = await requestToken({
    client_id: clientId(),
    client_secret: clientSecret(),
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  });

  if (!tokens.access_token) {
    throw new Error("Google did not return an access token.");
  }

  return tokens.access_token;
}

/** Signals that the caller must connect their Google account first. */
export class YouTubeNotConnectedError extends Error {
  constructor() {
    super("Connect a Google account to add YouTube sources.");
    this.name = "YouTubeNotConnectedError";
  }
}