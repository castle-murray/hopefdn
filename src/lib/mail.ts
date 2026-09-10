/**
 * Outbound email via SMTP (password resets, etc.).
 * Configure with SMTP_* env vars — see `.env.example`.
 *
 * When SMTP is not fully configured, messages are logged to the console so
 * local/dev still works without a real mailbox.
 */
import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";

export type MailMessage = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

function env(key: string): string | undefined {
  const value = process.env[key]?.trim();
  return value ? value : undefined;
}

/**
 * True when host + from address look like real SMTP (not placeholder example.com).
 * Dummy values in `.env` still document the keys; mail falls back to console log.
 */
export function isSmtpConfigured(): boolean {
  const host = env("SMTP_HOST");
  const from = env("SMTP_FROM");
  if (!host || !from) return false;
  if (host === "smtp.example.com" || host.endsWith(".example.com")) return false;
  if (from.includes("@example.com") || from.includes("hope.example.com")) return false;
  return true;
}

let transporter: Transporter | null = null;

function getTransporter(): Transporter | null {
  if (!isSmtpConfigured()) return null;
  if (transporter) return transporter;

  const host = env("SMTP_HOST")!;
  const port = Number(env("SMTP_PORT") ?? "587");
  const secure =
    env("SMTP_SECURE") === "true" || env("SMTP_SECURE") === "1" || port === 465;
  const user = env("SMTP_USER");
  const pass = env("SMTP_PASS");

  transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: user ? { user, pass: pass ?? "" } : undefined,
  });
  return transporter;
}

/**
 * Send an email. Never throws for "user not found" style product flows —
 * returns { ok, mode } so callers can decide. Transport errors are logged and
 * rethrown so password-reset can still return a generic success message
 * (callers should catch if they want to hide SMTP failures).
 */
export async function sendMail(
  message: MailMessage,
): Promise<{ ok: true; mode: "smtp" | "console" }> {
  const from =
    env("SMTP_FROM") ?? "H.O.P.E. Foundation <noreply@example.com>";
  const transport = getTransporter();

  if (!transport) {
    console.warn(
      "[mail] SMTP not configured — printing message instead of sending.\n" +
        `To: ${message.to}\nSubject: ${message.subject}\n\n${message.text}\n`,
    );
    return { ok: true, mode: "console" };
  }

  await transport.sendMail({
    from,
    to: message.to,
    subject: message.subject,
    text: message.text,
    html: message.html ?? message.text.replace(/\n/g, "<br/>"),
  });
  return { ok: true, mode: "smtp" };
}
