/**
 * Staff event image uploads — single optional file per event.
 * Files land under public/uploads/events/ (or UPLOAD_EVENTS_DIR) and are
 * served at /uploads/events/:name (static + API fallback).
 */
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

export const EVENT_UPLOAD_PUBLIC_PREFIX = "/uploads/events";

const MAX_BYTES = 5 * 1024 * 1024; // 5 MiB
const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export function getEventUploadsDir(): string {
  const override = process.env.UPLOAD_EVENTS_DIR?.trim();
  if (override) return path.resolve(override);
  return path.resolve(process.cwd(), "public", "uploads", "events");
}

export function isEventUploadUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  return url.startsWith(`${EVENT_UPLOAD_PUBLIC_PREFIX}/`);
}

/** Resolve a /uploads/events/… URL to an absolute path; null if unsafe. */
export function resolveEventUploadPath(
  imageUrl: string,
): string | null {
  if (!isEventUploadUrl(imageUrl)) return null;
  const name = imageUrl.slice(EVENT_UPLOAD_PUBLIC_PREFIX.length + 1);
  if (!name || name.includes("..") || name.includes("/") || name.includes("\\")) {
    return null;
  }
  if (!/^[a-zA-Z0-9._-]+$/.test(name)) return null;
  const dir = getEventUploadsDir();
  const full = path.resolve(dir, name);
  if (!full.startsWith(dir + path.sep) && full !== dir) return null;
  return full;
}

function extForContentType(contentType: string): string | null {
  const normalized = contentType.split(";")[0]?.trim().toLowerCase() ?? "";
  return ALLOWED_TYPES[normalized] ?? null;
}

/**
 * Persist a staff-uploaded image. Returns the public URL path.
 * `dataBase64` is raw base64 (no data: URL prefix).
 */
export async function saveEventImage(input: {
  dataBase64: string;
  contentType: string;
}): Promise<{ imageUrl: string }> {
  const ext = extForContentType(input.contentType);
  if (!ext) {
    throw new Error("Invalid image type. Use JPEG, PNG, WebP, or GIF.");
  }

  let buffer: Buffer;
  try {
    buffer = Buffer.from(input.dataBase64, "base64");
  } catch {
    throw new Error("Invalid image data");
  }
  if (buffer.byteLength === 0) throw new Error("Empty image");
  if (buffer.byteLength > MAX_BYTES) {
    throw new Error("Image too large (max 5 MB)");
  }

  // Light magic-byte check (reject obvious non-images / HTML uploads).
  if (!looksLikeImage(buffer, ext)) {
    throw new Error("File content does not match an allowed image type");
  }

  const dir = getEventUploadsDir();
  await mkdir(dir, { recursive: true });
  const filename = `${crypto.randomUUID()}.${ext}`;
  const full = path.join(dir, filename);
  await writeFile(full, buffer, { flag: "wx" });
  return { imageUrl: `${EVENT_UPLOAD_PUBLIC_PREFIX}/${filename}` };
}

export async function deleteEventImageFile(
  imageUrl: string | null | undefined,
): Promise<void> {
  const full = imageUrl ? resolveEventUploadPath(imageUrl) : null;
  if (!full) return;
  try {
    await unlink(full);
  } catch (err) {
    const code = (err as NodeJS.ErrnoException)?.code;
    if (code !== "ENOENT") throw err;
  }
}

function looksLikeImage(buf: Buffer, ext: string): boolean {
  if (buf.length < 12) return false;
  if (ext === "jpg") {
    return buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
  }
  if (ext === "png") {
    return (
      buf[0] === 0x89 &&
      buf[1] === 0x50 &&
      buf[2] === 0x4e &&
      buf[3] === 0x47
    );
  }
  if (ext === "gif") {
    return buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46;
  }
  if (ext === "webp") {
    return (
      buf[0] === 0x52 &&
      buf[1] === 0x49 &&
      buf[2] === 0x46 &&
      buf[3] === 0x46 &&
      buf[8] === 0x57 &&
      buf[9] === 0x45 &&
      buf[10] === 0x42 &&
      buf[11] === 0x50
    );
  }
  return false;
}
