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

/** Actor id for created_by / updated_by. Fail closed if unset. */
export function requireMcpActorUserId(): string {
  const id = process.env.HOPE_EVENTS_MCP_ACTOR_USER_ID?.trim() ?? "";
  if (!id) {
    throw new Error(
      "HOPE_EVENTS_MCP_ACTOR_USER_ID is not set — Homeserver must set an existing staff/admin user id",
    );
  }
  // Soft shape: UUID *or* Better Auth text user ids (sandbox `user.id` is text nanoid, not UUID).
  const uuidOk =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      id,
    );
  const betterAuthOk = /^[A-Za-z0-9_-]{16,64}$/.test(id);
  if (!uuidOk && !betterAuthOk) {
    throw new Error(
      "HOPE_EVENTS_MCP_ACTOR_USER_ID must be a UUID or existing staff/admin user id",
    );
  }
  return id;
}
