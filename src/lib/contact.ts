/**
 * Public "Get In Touch" form (About page, #contact) → email via SMTP.
 * Server-only sending; the client only gets ok / a friendly message.
 * Recipient: CONTACT_TO (comma-separated allowed). SMTP config: src/lib/mail.ts.
 */
import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import { site } from "@/data/site";

export const CONTACT_TOPICS = [
  "Help / Guest Services",
  "Volunteer",
  "Donate",
  "Partnership",
  "General Information",
] as const;

const contactSchema = z.object({
  name: z.string().trim().min(1, "Please enter your name.").max(120),
  email: z.string().trim().email("Please enter a valid email address.").max(200),
  phone: z.string().trim().max(40).optional().default(""),
  topic: z.enum(CONTACT_TOPICS).catch("General Information"),
  message: z.string().trim().min(1, "Please enter a message.").max(5000),
  /** Honeypot: hidden from people; bots fill it. */
  website: z.string().max(500).optional().default(""),
});

export type ContactResult = { ok: true } | { ok: false; message: string };

const FALLBACK = `Sorry, we couldn't send your message right now. Please call ${site.phone} or email ${site.email}.`;

// Basic per-IP rate limit (in memory; resets on restart): 5 per 10 minutes.
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;
const hits = new Map<string, number[]>();
function rateLimited(key: string): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length > MAX_PER_WINDOW;
}

function clientIp(): string {
  const h = getRequest()?.headers;
  return (
    h?.get("cf-connecting-ip") ??
    h?.get("x-real-ip") ??
    h?.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}

const oneLine = (v: string) => v.replace(/[\r\n]+/g, " ").trim();

export const submitContactForm = createServerFn({ method: "POST" })
  .validator((raw: unknown) => {
    const parsed = contactSchema.safeParse(raw);
    if (!parsed.success) {
      throw new Error(parsed.error.issues[0]?.message ?? "Please check the form.");
    }
    return parsed.data;
  })
  .handler(async ({ data }): Promise<ContactResult> => {
    // Bots: pretend success, send nothing.
    if (data.website) return { ok: true };

    if (rateLimited(clientIp())) {
      return {
        ok: false,
        message: `Too many messages from this connection. Please try again later, or call ${site.phone}.`,
      };
    }

    const { isSmtpConfigured, sendMail } = await import("./mail");
    const to = process.env.CONTACT_TO?.trim();
    if (!isSmtpConfigured() || !to) {
      console.warn(
        "[contact] SMTP_* or CONTACT_TO not configured — contact form message was NOT sent.",
      );
      return { ok: false, message: FALLBACK };
    }

    const text = [
      `New message from the website contact form (${site.name}).`,
      "",
      `Name:  ${oneLine(data.name)}`,
      `Email: ${oneLine(data.email)}`,
      `Phone: ${oneLine(data.phone) || "-"}`,
      `Topic: ${data.topic}`,
      "",
      "Message:",
      data.message,
    ].join("\n");
    const escape = (v: string) =>
      v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

    try {
      await sendMail({
        to,
        replyTo: oneLine(data.email),
        subject: `Website inquiry — ${data.topic} — ${oneLine(data.name)}`.slice(0, 200),
        text,
        html: `<pre style="font-family:inherit;white-space:pre-wrap">${escape(text)}</pre>`,
      });
      return { ok: true };
    } catch (err) {
      console.error("[contact] send failed:", err instanceof Error ? err.message : err);
      return { ok: false, message: FALLBACK };
    }
  });
