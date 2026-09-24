/**
 * In-process Hope Events MCP endpoint at public path `/mcp`.
 * Same Nitro/TanStack Start process as hopefdn-sandbox (:3009).
 * Auth: Authorization Bearer HOPE_EVENTS_MCP_API_KEY (or X-API-Key alias).
 */
import { createFileRoute } from "@tanstack/react-router";
import { McpAuthError, requireMcpApiKey } from "@/lib/events/mcp-auth";
import { handleHopeEventsMcpRequest } from "@/lib/events/mcp-server";

async function mcpHandler({ request }: { request: Request }): Promise<Response> {
  try {
    requireMcpApiKey(request);
  } catch (err) {
    if (err instanceof McpAuthError) return err.toResponse();
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "content-type": "application/json; charset=utf-8" },
    });
  }

  try {
    return await handleHopeEventsMcpRequest(request);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "content-type": "application/json; charset=utf-8" },
    });
  }
}

export const Route = createFileRoute("/mcp")({
  server: {
    handlers: {
      GET: mcpHandler,
      POST: mcpHandler,
      DELETE: mcpHandler,
    },
  },
});
