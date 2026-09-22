/**
 * Serve staff-uploaded event images from disk.
 * Dev: Vite also serves public/uploads statically; this covers Nitro node-server
 * when files are written at runtime after the static snapshot was built.
 */
import { createFileRoute } from "@tanstack/react-router";
import { readFile, stat } from "node:fs/promises";
import {
  getEventUploadsDir,
  resolveEventUploadPath,
} from "@/lib/events/upload.server";

const CONTENT_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
};

export const Route = createFileRoute("/uploads/events/$name")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const imageUrl = `/uploads/events/${params.name}`;
        const full = resolveEventUploadPath(imageUrl);
        if (!full) {
          return new Response("Not found", { status: 404 });
        }
        try {
          // Ensure dir exists conceptually (resolve already scoped under uploads dir)
          void getEventUploadsDir();
          const info = await stat(full);
          if (!info.isFile()) {
            return new Response("Not found", { status: 404 });
          }
          const ext = params.name.split(".").pop()?.toLowerCase() ?? "";
          const contentType = CONTENT_TYPES[ext] ?? "application/octet-stream";
          const body = await readFile(full);
          return new Response(body, {
            status: 200,
            headers: {
              "content-type": contentType,
              "cache-control": "public, max-age=86400",
              "content-length": String(body.byteLength),
            },
          });
        } catch {
          return new Response("Not found", { status: 404 });
        }
      },
    },
  },
});
