/**
 * Hope Events MCP server (in-process) — tools over Streamable HTTP.
 * Uses @modelcontextprotocol/sdk WebStandardStreamableHTTPServerTransport
 * (stateless + JSON responses) so TanStack Start / Nitro can return Response.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { z } from "zod";
import { ticketUrlSchema } from "./ticket-url";
import { requireMcpActorUserId } from "./mcp-auth";
import {
  mcpCreateEvent,
  mcpDeleteEvent,
  mcpGetEvent,
  mcpListEvents,
  mcpUpdateEvent,
} from "./mcp-store";
import { saveEventImage } from "./upload.server";

function textResult(data: unknown) {
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(data, null, 2),
      },
    ],
  };
}

function errorResult(err: unknown) {
  const message = err instanceof Error ? err.message : String(err);
  return {
    isError: true as const,
    content: [{ type: "text" as const, text: JSON.stringify({ error: message }) }],
  };
}

const iso = z.string().datetime({ offset: true });
const statusZ = z.enum(["draft", "published", "cancelled"]);

function stripDataUrlBase64(raw: string): { dataBase64: string; contentTypeHint?: string } {
  const trimmed = raw.trim();
  const m = /^data:([^;]+);base64,(.+)$/is.exec(trimmed);
  if (m) {
    return { contentTypeHint: m[1]!.trim().toLowerCase(), dataBase64: m[2]! };
  }
  return { dataBase64: trimmed };
}

function mimeFromFilename(name?: string): string | undefined {
  if (!name) return undefined;
  const ext = name.split(".").pop()?.toLowerCase();
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  if (ext === "gif") return "image/gif";
  return undefined;
}

/** Build a fresh McpServer with Hope Events tools (one per HTTP request in stateless mode). */
export function createHopeEventsMcpServer(): McpServer {
  const server = new McpServer({
    name: "hope-events",
    version: "1.2.0",
  });

  server.registerTool(
    "list_events",
    {
      title: "List events",
      description:
        "List Hope calendar events (keyset pagination). include_all_statuses defaults to true for MCP admin use (drafts included). Dates are ISO-8601 with offset; treat as America/New_York wall times when using ET offsets.",
      inputSchema: {
        from: iso.optional().describe("Inclusive lower bound ISO (default: now)"),
        to: iso.optional().describe("Exclusive upper bound ISO"),
        limit: z.number().int().min(1).max(100).optional(),
        cursor: z.string().min(1).max(512).optional(),
        include_all_statuses: z
          .boolean()
          .optional()
          .describe("Default true for MCP — include draft/cancelled"),
      },
    },
    async (args) => {
      try {
        const result = await mcpListEvents(args ?? {});
        return textResult(result);
      } catch (err) {
        return errorResult(err);
      }
    },
  );

  server.registerTool(
    "get_event",
    {
      title: "Get event",
      description: "Fetch one event by id or slug (all statuses).",
      inputSchema: {
        id: z.string().min(1).max(128).optional().describe("Event UUID"),
        slug: z.string().min(1).max(100).optional().describe("Event slug"),
      },
    },
    async (args) => {
      try {
        const event = await mcpGetEvent(args ?? {});
        if (!event) {
          return errorResult(new Error("Event not found"));
        }
        return textResult(event);
      } catch (err) {
        return errorResult(err);
      }
    },
  );

  server.registerTool(
    "upload_event_image",
    {
      title: "Upload event image",
      description:
        "Upload a flyer or banner image (JPEG/PNG/WebP/GIF, max 5 MB) via base64. purpose=flyer (default) returns { url, purpose, imageUrl }; purpose=banner returns { url, purpose, bannerUrl }. Pass imageUrl/bannerUrl into create_event / update_event. Same /uploads/events/ storage dir. Prefer mime or filename; data:image/...;base64,... URLs accepted.",
      inputSchema: {
        dataBase64: z
          .string()
          .min(1)
          .describe("Raw base64 bytes, or a data:image/...;base64,... URL"),
        mime: z
          .string()
          .trim()
          .max(100)
          .optional()
          .describe("image/jpeg | image/png | image/webp | image/gif"),
        filename: z
          .string()
          .trim()
          .max(200)
          .optional()
          .describe("Optional original filename (used to guess mime)"),
        purpose: z
          .enum(["flyer", "banner"])
          .optional()
          .describe("flyer (default) → imageUrl; banner → bannerUrl"),
      },
    },
    async (args) => {
      try {
        const parsed = stripDataUrlBase64(args.dataBase64);
        const contentType =
          args.mime?.trim() ||
          parsed.contentTypeHint ||
          mimeFromFilename(args.filename) ||
          "";
        if (!contentType) {
          throw new Error(
            "mime is required (or pass filename with .jpg/.png/.webp/.gif, or a data:image/...;base64 URL)",
          );
        }
        const result = await saveEventImage({
          dataBase64: parsed.dataBase64,
          contentType,
          purpose: args.purpose ?? "flyer",
        });
        return textResult(result);
      } catch (err) {
        return errorResult(err);
      }
    },
  );

  server.registerTool(
    "create_event",
    {
      title: "Create event",
      description:
        "Create a calendar event. imageUrl/bannerUrl should be paths from upload_event_image (/uploads/events/...) or omit. Uses HOPE_EVENTS_MCP_ACTOR_USER_ID for created_by.",
      inputSchema: {
        title: z.string().trim().min(1).max(200),
        description: z.string().trim().max(5000).optional(),
        location: z.string().trim().max(500).optional(),
        ctaLabel: z.string().trim().min(1).max(80).optional(),
        ctaUrl: z.string().url().max(2000).nullable().optional(),
        startsAt: iso.describe("ISO with offset (ET wall time documented)"),
        endsAt: iso.nullable().optional(),
        status: statusZ.optional(),
        slug: z
          .string()
          .trim()
          .min(1)
          .max(100)
          .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
          .optional(),
        imageUrl: z
          .string()
          .trim()
          .max(500)
          .nullable()
          .optional()
          .describe("Flyer /uploads/events/... or null"),
        bannerUrl: z
          .string()
          .trim()
          .max(500)
          .nullable()
          .optional()
          .describe("Banner/hero /uploads/events/... or null"),
        ticketUrl: ticketUrlSchema.describe(
          "Optional http(s) ticket link. Empty or null clears.",
        ),
        majorEvent: z
          .boolean()
          .optional()
          .describe("When true, this event can supply the public calendar banner."),
      },
    },
    async (args) => {
      try {
        const actor = requireMcpActorUserId();
        const event = await mcpCreateEvent(args as never, actor);
        return textResult(event);
      } catch (err) {
        return errorResult(err);
      }
    },
  );

  server.registerTool(
    "update_event",
    {
      title: "Update event",
      description:
        "Partial update by id. Only provided fields change. imageUrl/bannerUrl null clears that asset; omit leaves unchanged. Hard fields same as desk model.",
      inputSchema: {
        id: z.string().min(1).max(128),
        title: z.string().trim().min(1).max(200).optional(),
        description: z.string().trim().max(5000).optional(),
        location: z.string().trim().max(500).optional(),
        ctaLabel: z.string().trim().min(1).max(80).optional(),
        ctaUrl: z.string().url().max(2000).nullable().optional(),
        startsAt: iso.optional(),
        endsAt: iso.nullable().optional(),
        status: statusZ.optional(),
        slug: z
          .string()
          .trim()
          .min(1)
          .max(100)
          .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
          .optional(),
        imageUrl: z.string().trim().max(500).nullable().optional(),
        bannerUrl: z.string().trim().max(500).nullable().optional(),
        ticketUrl: ticketUrlSchema.describe(
          "Optional http(s) ticket link. Empty or null clears. Omit to leave unchanged.",
        ),
        majorEvent: z.boolean().optional(),
      },
    },
    async (args) => {
      try {
        const actor = requireMcpActorUserId();
        const event = await mcpUpdateEvent(args as never, actor);
        return textResult(event);
      } catch (err) {
        return errorResult(err);
      }
    },
  );

  server.registerTool(
    "delete_event",
    {
      title: "Delete event",
      description:
        "HARD DELETE from Postgres (matches desk). Also removes linked flyer and banner /uploads/events files when present. Prefer update_event status=cancelled for soft cancel.",
      inputSchema: {
        id: z.string().min(1).max(128),
      },
    },
    async (args) => {
      try {
        const result = await mcpDeleteEvent(args as never);
        return textResult(result);
      } catch (err) {
        return errorResult(err);
      }
    },
  );

  return server;
}

/**
 * Handle one MCP Streamable HTTP request (stateless JSON).
 * Caller must already have passed requireMcpApiKey.
 */
export async function handleHopeEventsMcpRequest(
  request: Request,
): Promise<Response> {
  const server = createHopeEventsMcpServer();
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });
  await server.connect(transport);
  try {
    return await transport.handleRequest(request);
  } finally {
    await transport.close().catch(() => undefined);
    await server.close().catch(() => undefined);
  }
}
