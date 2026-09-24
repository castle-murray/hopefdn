/**
 * Hope Events MCP server (in-process) — tools over Streamable HTTP.
 * Uses @modelcontextprotocol/sdk WebStandardStreamableHTTPServerTransport
 * (stateless + JSON responses) so TanStack Start / Nitro can return Response.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { z } from "zod";
import { requireMcpActorUserId } from "./mcp-auth";
import {
  mcpCreateEvent,
  mcpDeleteEvent,
  mcpGetEvent,
  mcpListEvents,
  mcpUpdateEvent,
} from "./mcp-store";

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

/** Build a fresh McpServer with Hope Events tools (one per HTTP request in stateless mode). */
export function createHopeEventsMcpServer(): McpServer {
  const server = new McpServer({
    name: "hope-events",
    version: "1.0.0",
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
    "create_event",
    {
      title: "Create event",
      description:
        "Create a calendar event. imageUrl must already be an uploaded /uploads/events/... path (or omit). No multipart upload in MCP v1. Uses HOPE_EVENTS_MCP_ACTOR_USER_ID for created_by.",
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
          .describe("/uploads/events/... or null"),
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
        "Partial update by id. Only provided fields change. imageUrl null clears flyer; omit leaves unchanged. Hard fields same as desk model.",
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
        "HARD DELETE from Postgres (matches desk). Also removes linked /uploads/events image file when present. Prefer update_event status=cancelled for soft cancel.",
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
