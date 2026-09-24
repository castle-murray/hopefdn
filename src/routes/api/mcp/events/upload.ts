/**
 * Bearer-auth multipart flyer upload for Celeste/curl.
 * POST /api/mcp/events/upload  field name: file
 * Auth: same as /mcp — Authorization Bearer or X-API-Key.
 * Returns JSON { imageUrl: "/uploads/events/<uuid>.<ext>" }
 */
import { createFileRoute } from "@tanstack/react-router";
import { McpAuthError, requireMcpApiKey } from "@/lib/events/mcp-auth";
import { saveEventImage } from "@/lib/events/upload.server";

async function uploadHandler({ request }: { request: Request }): Promise<Response> {
  try {
    requireMcpApiKey(request);
  } catch (err) {
    if (err instanceof McpAuthError) return err.toResponse();
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "content-type": "application/json; charset=utf-8" },
    });
  }

  if (request.method.toUpperCase() !== "POST") {
    return new Response(JSON.stringify({ error: "Method Not Allowed" }), {
      status: 405,
      headers: { "content-type": "application/json; charset=utf-8", allow: "POST" },
    });
  }

  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!file || typeof file === "string") {
      return new Response(
        JSON.stringify({ error: "Missing multipart field 'file'" }),
        {
          status: 400,
          headers: { "content-type": "application/json; charset=utf-8" },
        },
      );
    }

    const blob = file as File;
    const buf = Buffer.from(await blob.arrayBuffer());
    const contentType =
      (blob.type && blob.type.trim()) ||
      guessMime(blob.name) ||
      "application/octet-stream";

    const result = await saveEventImage({
      dataBase64: buf.toString("base64"),
      contentType,
    });

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "content-type": "application/json; charset=utf-8" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const status =
      /Invalid image|Empty image|too large|does not match|mime/i.test(message)
        ? 400
        : 500;
    return new Response(JSON.stringify({ error: message }), {
      status,
      headers: { "content-type": "application/json; charset=utf-8" },
    });
  }
}

function guessMime(name?: string): string | undefined {
  if (!name) return undefined;
  const ext = name.split(".").pop()?.toLowerCase();
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  if (ext === "gif") return "image/gif";
  return undefined;
}

export const Route = createFileRoute("/api/mcp/events/upload")({
  server: {
    handlers: {
      POST: uploadHandler,
    },
  },
});
