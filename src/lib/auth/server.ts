/**
 * Self-hosted Better Auth for THIS app (server-only).
 *
 * Username + password only. Public self-registration is disabled — superusers
 * create accounts. No SSO / OAuth broker.
 *
 * NEVER import this from client code — it pulls in `pg` + server-only Better
 * Auth internals. The client uses `@/lib/auth/client`.
 */
import { betterAuth } from "better-auth";
import { bearer, username } from "better-auth/plugins";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { getCookie } from "@tanstack/react-start/server";
import { randomBytes } from "node:crypto";
import { Pool } from "pg";
import { ensureDbReady, getPglite } from "../db";
import {
  emailAndPasswordEnabled,
  publicSignUpDisabled,
} from "./email-password";
import { pgliteDialect } from "./pglite-dialect";
import { PREVIEW_ALLOWED_HOSTS } from "./preview";
import {
  PRIMARY_PUBLIC_HOST,
  PUBLIC_HOSTS,
  publicOrigins,
} from "../public-hosts";

// Kick (and share) PGLite bootstrap as soon as the auth server module loads.
void ensureDbReady();

/**
 * Preview secret must outlive module reloads: PGLite (and its session rows) is
 * stored on `globalThis`, so an HMR re-eval of this file must NOT mint a new
 * signing secret or every existing session becomes invalid mid-dev. Process
 * restart clears both the secret and PGLite together.
 */
const globalAuthRef = globalThis as typeof globalThis & {
  __grokAuthPreviewSecret__?: string;
  __superuserBootstrap__?: Promise<void>;
};
function previewAuthSecret(): string {
  globalAuthRef.__grokAuthPreviewSecret__ ??= randomBytes(32).toString("hex");
  return globalAuthRef.__grokAuthPreviewSecret__;
}

/** Read an env var, treating empty/whitespace as unset. */
const env = (key: string): string | undefined => {
  const value = process.env[key]?.trim();
  return value ? value : undefined;
};

// Explicit off-switch. Set `VITE_AUTH_ENABLED=false` to force auth off (dev user).
const authDisabled = env("VITE_AUTH_ENABLED") === "false";

/** True when username/password auth is active (real sessions enforced). */
export const authConfigured = !authDisabled && emailAndPasswordEnabled;

// Resolve Better Auth origin from the request Host against the allowlist so
// hopefdn.org, www.hopefdn.org, and hope.castle-murray.com all work.
// Optional BETTER_AUTH_URL is only the fallback when Host is missing — not a
// single-host lock (that would break multi-domain).
const explicitBaseURL = env("BETTER_AUTH_URL");
const previewAllowedHosts: string[] = [...PREVIEW_ALLOWED_HOSTS];
const LOCAL_DEV_ORIGINS: string[] = [
  "http://localhost:8080",
  "http://127.0.0.1:8080",
  "http://[::1]:8080",
];
const PUBLIC_ORIGINS = publicOrigins(PUBLIC_HOSTS);

const baseURL = {
  allowedHosts: [
    ...previewAllowedHosts,
    "localhost",
    "127.0.0.1",
    "[::1]",
    ...PUBLIC_HOSTS,
  ],
  protocol: "auto" as const,
  fallback:
    explicitBaseURL ?? `https://${PRIMARY_PUBLIC_HOST}`,
};

const trustedOrigins: string[] = [
  ...previewAllowedHosts,
  ...previewAllowedHosts.flatMap((host) => [
    `https://${host}`,
    `http://${host}`,
  ]),
  ...PUBLIC_ORIGINS,
  ...LOCAL_DEV_ORIGINS,
  ...(explicitBaseURL ? [explicitBaseURL] : []),
];

const databaseUrl = env("DATABASE_URL");

// Real Postgres when `DATABASE_URL` is set, else embedded PGLite (preview).
const database = databaseUrl
  ? new Pool({ connectionString: databaseUrl })
  : { dialect: pgliteDialect(() => getPglite()), type: "postgres" as const };

/** Session token cookie name. */
export const SESSION_TOKEN_COOKIE = "__Host-grok-auth.session_token";

export const auth = betterAuth({
  baseURL,
  secret: env("BETTER_AUTH_SECRET") ?? previewAuthSecret(),
  database,
  trustedOrigins,

  session: { cookieCache: { enabled: true, maxAge: 300 } },

  // Username + password only; public sign-up closed.
  // Password reset emails go through SMTP (`src/lib/mail.ts` + SMTP_* env).
  ...(emailAndPasswordEnabled
    ? {
        emailAndPassword: {
          enabled: true,
          disableSignUp: publicSignUpDisabled,
          resetPasswordTokenExpiresIn: Number(
            env("RESET_PASSWORD_TOKEN_EXPIRES_IN") ?? String(60 * 60),
          ),
          sendResetPassword: async ({ user, url }) => {
            const { sendMail } = await import("../mail");
            const name = user.name?.trim() || user.email;
            await sendMail({
              to: user.email,
              subject: "Reset your H.O.P.E. Foundation password",
              text: [
                `Hi ${name},`,
                "",
                "We received a request to reset your staff account password.",
                "Open this link to choose a new password (it expires soon):",
                "",
                url,
                "",
                "If you did not request this, you can ignore this email.",
                "",
                "— H.O.P.E. Foundation",
              ].join("\n"),
              html: `
                <p>Hi ${escapeHtml(name)},</p>
                <p>We received a request to reset your staff account password.</p>
                <p><a href="${escapeHtml(url)}">Choose a new password</a></p>
                <p style="color:#666;font-size:0.9em">If the button does not work, paste this URL into your browser:<br/>${escapeHtml(url)}</p>
                <p>If you did not request this, you can ignore this email.</p>
                <p>— H.O.P.E. Foundation</p>
              `,
            });
          },
        },
      }
    : {}),

  advanced: {
    useSecureCookies: false,
    defaultCookieAttributes: { secure: true, sameSite: "lax", path: "/" },
    cookies: {
      session_token: { name: SESSION_TOKEN_COOKIE },
      session_data: { name: "__Host-grok-auth.session_data" },
      account_data: { name: "__Host-grok-auth.account_data" },
      dont_remember: { name: "__Host-grok-auth.dont_remember" },
    },
  },

  plugins: [
    username({
      minUsernameLength: 3,
      maxUsernameLength: 32,
    }),
    bearer(),
    tanstackStartCookies(),
  ],
});

export function readSessionToken(): string | null {
  return getCookie(SESSION_TOKEN_COOKIE) ?? null;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Ensure a superuser exists when none have the admin role.
 * Credentials from SUPERUSER_USERNAME / SUPERUSER_PASSWORD (defaults for local
 * exhibition only — change them before production).
 */
export async function ensureSuperuser(): Promise<void> {
  if (!authConfigured) return;
  globalAuthRef.__superuserBootstrap__ ??= (async () => {
    await ensureDbReady();
    const { getSql } = await import("../db");
    const sql = await getSql();
    const admins = await sql.query<{ n: number }>(
      `select count(*)::int as n from user_roles where role = 'admin'`,
    );
    if (Number(admins[0]?.n ?? 0) > 0) return;

    const username = (env("SUPERUSER_USERNAME") ?? "admin").toLowerCase();
    const password = env("SUPERUSER_PASSWORD") ?? "changeme";
    const name = env("SUPERUSER_NAME") ?? "Superuser";
    const email =
      env("SUPERUSER_EMAIL") ?? `${username}@accounts.local`;

    const ctx = await auth.$context;
    const existing = await ctx.internalAdapter.findUserByEmail(email);
    let userId: string;
    if (existing?.user) {
      userId = existing.user.id;
    } else {
      const hashed = await ctx.password.hash(password);
      const user = await ctx.internalAdapter.createUser({
        email,
        name,
        emailVerified: true,
        username,
        displayUsername: username,
      } as Parameters<typeof ctx.internalAdapter.createUser>[0]);
      if (!user) throw new Error("Failed to create superuser");
      userId = user.id;
      await ctx.internalAdapter.linkAccount({
        userId,
        providerId: "credential",
        accountId: userId,
        password: hashed,
      });
    }

    await sql.query(
      `insert into user_roles (user_id, role) values ($1, 'admin')
       on conflict (user_id, role) do nothing`,
      [userId],
    );
    console.warn(
      `[auth] Bootstrapped superuser "${username}". Set SUPERUSER_USERNAME / SUPERUSER_PASSWORD and change the default password.`,
    );
  })().catch((err) => {
    globalAuthRef.__superuserBootstrap__ = undefined;
    console.error("[auth] Superuser bootstrap failed:", err);
    throw err;
  });
  return globalAuthRef.__superuserBootstrap__;
}

// Bootstrap after DB is ready (async, non-blocking for module load).
if (authConfigured) {
  void ensureDbReady()
    .then(() => ensureSuperuser())
    .catch((err) => console.error("[auth] Startup bootstrap failed:", err));
}
