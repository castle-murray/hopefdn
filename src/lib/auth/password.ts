/**
 * Password change / reset helpers as server functions.
 * Reset email uses Better Auth tokens + SMTP (`src/lib/mail.ts`).
 */
import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import { getSql } from "@/lib/db";
import { auth } from "./server";
import { authMiddleware } from "./middleware";
import { requireAdmin } from "./staff.server";

const changeSchema = z.object({
  currentPassword: z.string().min(1).max(128),
  newPassword: z.string().min(8).max(128),
});

/** Logged-in user changes their own password. */
export const changeMyPassword = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((raw: unknown) => changeSchema.parse(raw))
  .handler(async ({ data }): Promise<{ ok: true }> => {
    const request = getRequest();
    if (!request) throw new Error("No request context");

    const result = await auth.api.changePassword({
      body: {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
        revokeOtherSessions: true,
      },
      headers: request.headers,
    });

    if (!result) throw new Error("Could not change password");
    return { ok: true };
  });

const forgotSchema = z.object({
  /** Username or email */
  identifier: z.string().trim().min(1).max(200),
});

/**
 * Request a password-reset email.
 * Always returns a generic success message (no account enumeration).
 */
export const requestPasswordResetEmail = createServerFn({ method: "POST" })
  .validator((raw: unknown) => forgotSchema.parse(raw))
  .handler(async ({ data }): Promise<{ ok: true; message: string }> => {
    const identifier = data.identifier.trim();
    let email: string | null = null;

    if (identifier.includes("@")) {
      email = identifier.toLowerCase();
    } else {
      const sql = await getSql();
      const rows = await sql.query<{ email: string }>(
        `select email from "user" where username = $1 limit 1`,
        [identifier.toLowerCase()],
      );
      email = rows[0]?.email ?? null;
    }

    const message =
      "If an account matches that username or email, a reset link has been sent. Check your inbox (and spam).";

    if (!email) return { ok: true, message };

    try {
      const request = getRequest();
      let origin = request?.headers.get("origin")?.replace(/\/$/, "") ?? "";
      if (!origin) {
        const host =
          request?.headers.get("x-forwarded-host") ??
          request?.headers.get("host");
        const proto = request?.headers.get("x-forwarded-proto") ?? "http";
        if (host) origin = `${proto}://${host}`;
      }
      if (!origin) {
        origin =
          process.env.BETTER_AUTH_URL?.trim() || "http://localhost:8080";
      }

      await auth.api.requestPasswordReset({
        body: {
          email,
          redirectTo: `${origin.replace(/\/$/, "")}/reset-password`,
        },
        headers: request?.headers,
      });
    } catch (err) {
      // Log only — still return generic success to the client.
      console.error("[auth] requestPasswordReset failed:", err);
    }

    return { ok: true, message };
  });

const adminSetPasswordSchema = z.object({
  userId: z.string().min(1),
  newPassword: z.string().min(8).max(128),
});

/** Superuser sets another user's password (no current password required). */
export const adminSetUserPassword = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((raw: unknown) => adminSetPasswordSchema.parse(raw))
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    await requireAdmin(context.userId);
    const ctx = await auth.$context;
    const hashed = await ctx.password.hash(data.newPassword);
    const accounts = await ctx.internalAdapter.findAccounts(data.userId);
    const credential = accounts.find((a) => a.providerId === "credential");
    if (credential) {
      await ctx.internalAdapter.updatePassword(data.userId, hashed);
    } else {
      await ctx.internalAdapter.createAccount({
        userId: data.userId,
        providerId: "credential",
        accountId: data.userId,
        password: hashed,
      });
    }
    return { ok: true };
  });
