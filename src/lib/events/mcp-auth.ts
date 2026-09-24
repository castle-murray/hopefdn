/**
 * Hope Events MCP API-key auth (sandbox).
 * Primary: Authorization: Bearer <HOPE_EVENTS_MCP_API_KEY>
 * Alias:   X-API-Key: <HOPE_EVENTS_MCP_API_KEY>
 * Missing/empty env → 503 (misconfigured), never open access.
 */
import { timingSafeEqual } from "node:crypto";

export class McpAuthError extends Error {
  readonly status: number;
  readonly body: Record<string, unknown>;

  constructor(status: number, message: string, extra?: Record<string, unknown>) {
    super(message);
    this.name = "McpAuthError";
    this.status = status;
    this.body = { error: message, ...extra };
  }

  toResponse(): Response {
    return new Response(JSON.stringify(this.body), {
      status: this.status,
      headers: { "content-type": "application/json; charset=utf-8" },
    });
  }
}

function safeEqualString(a: string, b: string): boolean {
  const ab = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  if (ab.length !== bb.length) {
    // Still compare equal-length buffers to reduce timing leak on length.
    timingSafeEqual(ab, ab);
    return false;
  }
  return timingSafeEqual(ab, bb);
}

function extractPresentedKey(request: Request): string | null {
  const auth = request.headers.get("authorization");
  if (auth) {
    const m = /^Bearer\s+(.+)$/i.exec(auth.trim());
    if (m?.[1]) return m[1].trim();
  }
  const xKey = request.headers.get("x-api-key");
  if (xKey?.trim()) return xKey.trim();
  return null;
}

/**
 * Throws McpAuthError (401/503) if the request is not authorized.
 * Call at the top of the /mcp route before MCP transport handling.
 */
export function requireMcpApiKey(request: Request): void {
  const expected = process.env.HOPE_EVENTS_MCP_API_KEY?.trim() ?? "";
  if (!expected) {
    throw new McpAuthError(
      503,
      "HOPE_EVENTS_MCP_API_KEY is not configured",
      { code: "mcp_misconfigured" },
    );
  }

  const presented = extractPresentedKey(request);
  if (!presented || !safeEqualString(presented, expected)) {
    throw new McpAuthError(401, "Unauthorized", { code: "mcp_unauthorized" });
  }
}

/** Actor user id for created_by / updated_by. Fail closed if unset.
 * Better Auth / desk user ids are opaque text (often UUID, sometimes short ids
 * like superuser "1") — do NOT require UUID shape. FK still enforces existence.
 */
export function requireMcpActorUserId(): string {
  const id = process.env.HOPE_EVENTS_MCP_ACTOR_USER_ID?.trim() ?? "";
  if (!id) {
    throw new Error(
      "HOPE_EVENTS_MCP_ACTOR_USER_ID is not set — Homeserver must set an existing staff/admin user id from \"user\".id",
    );
  }
  // Opaque desk id: 1–128 chars, no whitespace/control. UUID not required.
  if (id.length > 128 || /\s/.test(id) || /[\x00-\x1f\x7f]/.test(id)) {
    throw new Error(
      "HOPE_EVENTS_MCP_ACTOR_USER_ID must be a non-empty desk user id (text PK, max 128)",
    );
  }
  return id;
}
