import { z } from "zod";

/** Empty or null clears. Undefined stays omitted. Otherwise an http(s) URL. */
export function normalizeTicketUrl(
  value: string | null | undefined,
): string | null | undefined {
  if (value === undefined) return undefined;
  if (value == null) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.length > 2000) {
    throw new Error("Ticket link must be 2000 characters or fewer");
  }
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    throw new Error("Ticket link must be an http(s) URL");
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("Ticket link must be an http(s) URL");
  }
  return trimmed;
}

export const ticketUrlSchema = z
  .string()
  .max(2000)
  .nullable()
  .optional()
  .transform((value, ctx) => {
    try {
      return normalizeTicketUrl(value);
    } catch (err) {
      ctx.addIssue({
        code: "custom",
        message:
          err instanceof Error ? err.message : "Ticket link must be an http(s) URL",
      });
      return z.NEVER;
    }
  });
