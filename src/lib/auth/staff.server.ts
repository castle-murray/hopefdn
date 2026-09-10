/**
 * Staff / admin access for calendar + user management (server-only).
 *
 * Roles live in `user_roles`:
 * - admin (superuser): create accounts, grant roles, manage calendar
 * - staff: manage calendar only
 *
 * No public bootstrap — only an existing admin (or SUPERUSER_* env bootstrap)
 * can grant roles.
 */
import { getSql } from "@/lib/db";
import { getSessionUser } from "./verify.server";

export type AppRole = "staff" | "admin";

export class ForbiddenError extends Error {
  readonly status = 403;
  constructor(message = "Forbidden") {
    super(message);
    this.name = "ForbiddenError";
  }
}

async function hasRole(userId: string, roles: AppRole[]): Promise<boolean> {
  if (roles.length === 0) return false;
  const sql = await getSql();
  const placeholders = roles.map((_, i) => `$${i + 2}`).join(", ");
  const rows = await sql.query<{ ok: number }>(
    `select 1 as ok from user_roles
     where user_id = $1 and role in (${placeholders})
     limit 1`,
    [userId, ...roles],
  );
  return rows.length > 0;
}

export async function grantRole(userId: string, role: AppRole): Promise<void> {
  const sql = await getSql();
  await sql.query(
    `insert into user_roles (user_id, role) values ($1, $2)
     on conflict (user_id, role) do nothing`,
    [userId, role],
  );
}

export async function revokeRole(userId: string, role: AppRole): Promise<void> {
  const sql = await getSql();
  await sql.query(`delete from user_roles where user_id = $1 and role = $2`, [
    userId,
    role,
  ]);
}

export async function listRolesForUser(userId: string): Promise<AppRole[]> {
  const sql = await getSql();
  const rows = await sql.query<{ role: AppRole }>(
    `select role from user_roles where user_id = $1 order by role`,
    [userId],
  );
  return rows.map((r) => r.role);
}

export async function isStaffUser(userId: string): Promise<boolean> {
  return hasRole(userId, ["staff", "admin"]);
}

export async function isAdminUser(userId: string): Promise<boolean> {
  return hasRole(userId, ["admin"]);
}

/** Soft check — no side effects. */
export async function ensureStaffAccess(userId: string): Promise<boolean> {
  return isStaffUser(userId);
}

export async function requireStaff(userId: string): Promise<void> {
  if (!(await isStaffUser(userId))) {
    throw new ForbiddenError(
      "Staff access required. Ask a superuser to grant you the staff role.",
    );
  }
}

export async function requireAdmin(userId: string): Promise<void> {
  if (!(await isAdminUser(userId))) {
    throw new ForbiddenError("Superuser (admin) access required.");
  }
}

export async function requireStaffFromSession(bearerToken?: string): Promise<{
  userId: string;
  email: string | null;
}> {
  const user = await getSessionUser(bearerToken);
  if (!user) {
    const { UnauthorizedError } = await import("./verify.server");
    throw new UnauthorizedError();
  }
  await requireStaff(user.id);
  return { userId: user.id, email: user.email };
}

export async function requireAdminFromSession(bearerToken?: string): Promise<{
  userId: string;
  email: string | null;
}> {
  const user = await getSessionUser(bearerToken);
  if (!user) {
    const { UnauthorizedError } = await import("./verify.server");
    throw new UnauthorizedError();
  }
  await requireAdmin(user.id);
  return { userId: user.id, email: user.email };
}
