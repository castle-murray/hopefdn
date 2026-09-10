import { usernameClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

/**
 * Better Auth client for this React SPA (browser-side).
 * Username + password only — no OAuth / SSO.
 */
export const authClient = createAuthClient({
  plugins: [usernameClient()],
  fetchOptions: {
    onRequest(ctx) {
      const token = getBearerToken();
      if (token) ctx.headers.set("Authorization", `Bearer ${token}`);
      return ctx;
    },
  },
});

/**
 * True when sign-in is available. Set `VITE_AUTH_ENABLED=false` to force off.
 */
export const authEnabled = import.meta.env.VITE_AUTH_ENABLED !== "false";

// ── Optional bearer token (legacy preview path) ──────────────────────────────
const BEARER_KEY = "grok-auth.bearer-token";

export function getBearerToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage.getItem(BEARER_KEY);
  } catch {
    return null;
  }
}

function setBearerToken(token: string | null): void {
  if (typeof window === "undefined") return;
  try {
    if (token) window.sessionStorage.setItem(BEARER_KEY, token);
    else window.sessionStorage.removeItem(BEARER_KEY);
  } catch {
    /* storage unavailable */
  }
}

/** Sign out of this app's local session, then redirect. */
export async function signOut(redirectTo = "/"): Promise<void> {
  try {
    await authClient.signOut();
  } finally {
    setBearerToken(null);
  }
  window.location.href = redirectTo;
}
