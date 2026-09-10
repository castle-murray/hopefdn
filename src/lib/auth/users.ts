/**
 * Superuser account administration (server-only).
 * Create users and grant/revoke staff & admin roles.
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

const roleSchema = z.enum(["staff", "admin"]);

function toIso(value: string | Date): string {
  if (value instanceof Date) return value.toISOString();
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? String(value) : d.toISOString();
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
