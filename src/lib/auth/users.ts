/**
 * Superuser account administration (server-only).
 * Create users and grant/revoke staff & admin roles.
 * Delete users with optional reassignment of still-owned content.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSql } from "@/lib/db";
import { auth } from "./server";
import { authMiddleware } from "./middleware";
import {
  grantRole,
  listRolesForUser,
  requireAdmin,
  revokeRole,
  type AppRole,
} from "./staff.server";

export type ManagedUser = {
  id: string;
  username: string | null;
  name: string;
  email: string;
  roles: AppRole[];
  createdAt: string;
};

/**
 * App content still tied to a user via FK (auth tables cascade and are omitted).
 * Today only `events.created_by` / `events.updated_by` — both ON DELETE SET NULL,
 * but we reassign before delete so history is preserved when rows remain.
 */
export type UserContentOwnership = {
  eventsCreatedBy: number;
  eventsUpdatedBy: number;
  /** Distinct events with created_by or updated_by pointing at this user */
  eventsTotal: number;
  needsReassign: boolean;
};

const roleSchema = z.enum(["staff", "admin"]);

function toIso(value: string | Date): string {
  if (value instanceof Date) return value.toISOString();
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? String(value) : d.toISOString();
}

async function countUserContentOwnership(
  userId: string,
): Promise<UserContentOwnership> {
  const sql = await getSql();
  const rows = await sql.query<{
    eventsCreatedBy: number;
    eventsUpdatedBy: number;
    eventsTotal: number;
  }>(
    `select
       (select count(*)::int from events where created_by = $1) as "eventsCreatedBy",
       (select count(*)::int from events where updated_by = $1) as "eventsUpdatedBy",
       (select count(*)::int from events
         where created_by = $1 or updated_by = $1) as "eventsTotal"`,
    [userId],
  );
  const r = rows[0] ?? {
    eventsCreatedBy: 0,
    eventsUpdatedBy: 0,
    eventsTotal: 0,
  };
  const eventsTotal = Number(r.eventsTotal);
  return {
    eventsCreatedBy: Number(r.eventsCreatedBy),
    eventsUpdatedBy: Number(r.eventsUpdatedBy),
    eventsTotal,
    needsReassign: eventsTotal > 0,
  };
}

export const listManagedUsers = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<ManagedUser[]> => {
    await requireAdmin(context.userId);
    const sql = await getSql();
    const rows = await sql.query<{
      id: string;
      username: string | null;
      name: string;
      email: string;
      createdAt: string | Date;
    }>(
      `select id, username, name, email, "createdAt" as "createdAt"
       from "user"
       order by "createdAt" asc`,
    );
    const out: ManagedUser[] = [];
    for (const row of rows) {
      out.push({
        id: row.id,
        username: row.username,
        name: row.name,
        email: row.email,
        roles: await listRolesForUser(row.id),
        createdAt: toIso(row.createdAt),
      });
    }
    return out;
  });

const createUserSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3)
    .max(32)
    .regex(/^[a-zA-Z0-9_]+$/, "Username: letters, numbers, underscore only"),
  password: z.string().min(8).max(128),
  name: z.string().trim().min(1).max(120),
  email: z.string().email().optional(),
  roles: z.array(roleSchema).default(["staff"]),
});

export const createManagedUser = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((raw: unknown) => createUserSchema.parse(raw))
  .handler(async ({ data, context }): Promise<ManagedUser> => {
    await requireAdmin(context.userId);

    const username = data.username.toLowerCase();
    const email = (data.email ?? `${username}@accounts.local`).toLowerCase();
    const ctx = await auth.$context;

    if (await ctx.internalAdapter.findUserByEmail(email)) {
      throw new Error("A user with that email already exists");
    }

    const sql = await getSql();
    const taken = await sql.query<{ id: string }>(
      `select id from "user" where username = $1 limit 1`,
      [username],
    );
    if (taken.length > 0) throw new Error("Username is already taken");

    const hashed = await ctx.password.hash(data.password);
    const user = await ctx.internalAdapter.createUser({
      email,
      name: data.name,
      emailVerified: true,
      username,
      displayUsername: data.username,
    } as Parameters<typeof ctx.internalAdapter.createUser>[0]);
    if (!user) throw new Error("Failed to create user");

    await ctx.internalAdapter.linkAccount({
      userId: user.id,
      providerId: "credential",
      accountId: user.id,
      password: hashed,
    });

    for (const role of data.roles) {
      await grantRole(user.id, role);
    }

    return {
      id: user.id,
      username,
      name: data.name,
      email,
      roles: await listRolesForUser(user.id),
      createdAt: toIso(user.createdAt ?? new Date()),
    };
  });

const setRolesSchema = z.object({
  userId: z.string().min(1),
  roles: z.array(roleSchema),
});

export const setUserRoles = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((raw: unknown) => setRolesSchema.parse(raw))
  .handler(async ({ data, context }): Promise<ManagedUser> => {
    await requireAdmin(context.userId);

    if (data.userId === context.userId && !data.roles.includes("admin")) {
      throw new Error("You cannot remove your own admin role");
    }

    const sql = await getSql();
    const rows = await sql.query<{
      id: string;
      username: string | null;
      name: string;
      email: string;
      createdAt: string | Date;
    }>(
      `select id, username, name, email, "createdAt" as "createdAt"
       from "user" where id = $1 limit 1`,
      [data.userId],
    );
    const row = rows[0];
    if (!row) throw new Error("User not found");

    const current = await listRolesForUser(data.userId);
    const next = new Set(data.roles);

    // Prevent wiping the last admin before mutating roles.
    if (current.includes("admin") && !next.has("admin")) {
      const admins = await sql.query<{ n: number }>(
        `select count(*)::int as n from user_roles where role = 'admin'`,
      );
      if (Number(admins[0]?.n ?? 0) <= 1) {
        throw new Error("Cannot remove the last admin");
      }
    }

    for (const role of current) {
      if (!next.has(role)) await revokeRole(data.userId, role);
    }
    for (const role of next) {
      if (!current.includes(role)) await grantRole(data.userId, role);
    }

    return {
      id: row.id,
      username: row.username,
      name: row.name,
      email: row.email,
      roles: await listRolesForUser(row.id),
      createdAt: toIso(row.createdAt),
    };
  });

const ownershipSchema = z.object({
  userId: z.string().min(1),
});

/** Inspect still-owned app content before an admin delete. */
export const getUserContentOwnership = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((raw: unknown) => ownershipSchema.parse(raw))
  .handler(async ({ data, context }): Promise<UserContentOwnership> => {
    await requireAdmin(context.userId);
    return countUserContentOwnership(data.userId);
  });

const deleteUserSchema = z.object({
  userId: z.string().min(1),
  /** Required when the user still owns events (created_by / updated_by). */
  reassignToUserId: z.string().min(1).optional(),
});

/**
 * Delete a user. Sessions, accounts, and roles cascade via schema.
 * If any events still reference the user, `reassignToUserId` is required;
 * reassignment + delete run in one SQL statement (single transaction).
 */
export const deleteManagedUser = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((raw: unknown) => deleteUserSchema.parse(raw))
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    await requireAdmin(context.userId);

    if (data.userId === context.userId) {
      throw new Error("You cannot delete your own account");
    }

    const sql = await getSql();
    const rows = await sql.query<{ id: string }>(
      `select id from "user" where id = $1 limit 1`,
      [data.userId],
    );
    if (!rows[0]) throw new Error("User not found");

    const roles = await listRolesForUser(data.userId);
    if (roles.includes("admin")) {
      const admins = await sql.query<{ n: number }>(
        `select count(*)::int as n from user_roles where role = 'admin'`,
      );
      if (Number(admins[0]?.n ?? 0) <= 1) {
        throw new Error("Cannot delete the last admin");
      }
    }

    const ownership = await countUserContentOwnership(data.userId);
    if (ownership.needsReassign) {
      if (!data.reassignToUserId) {
        throw new Error(
          `User still owns content (${ownership.eventsTotal} event${
            ownership.eventsTotal === 1 ? "" : "s"
          }). Choose another user to reassign to before deleting.`,
        );
      }
      if (data.reassignToUserId === data.userId) {
        throw new Error(
          "Cannot reassign content to the same user being deleted",
        );
      }
      const target = await sql.query<{ id: string }>(
        `select id from "user" where id = $1 limit 1`,
        [data.reassignToUserId],
      );
      if (!target[0]) throw new Error("Reassign target user not found");

      // Modifying CTEs + DELETE = one statement / one transaction on Neon & PGLite.
      await sql.query(
        `with reassign_created as (
           update events set created_by = $2 where created_by = $1
         ),
         reassign_updated as (
           update events set updated_by = $2 where updated_by = $1
         )
         delete from "user" where id = $1`,
        [data.userId, data.reassignToUserId],
      );
    } else {
      // Cascades: session, account, user_roles. events.* already SET NULL if any.
      await sql.query(`delete from "user" where id = $1`, [data.userId]);
    }

    return { ok: true };
  });

export const canManageUsers = createServerFn({ method: "GET" }).handler(
  async (): Promise<boolean> => {
    try {
      const { getSessionUser } = await import("./verify.server");
      const user = await getSessionUser();
      if (!user) return false;
      const { isAdminUser } = await import("./staff.server");
      return isAdminUser(user.id);
    } catch {
      return false;
    }
  },
);

export const getMyRoles = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<AppRole[]> => {
    return listRolesForUser(context.userId);
  });