/**
 * Public hostnames this app may be served on (reverse proxy / production).
 * Used for Vite allowedHosts, Better Auth baseURL allowlist, and trustedOrigins.
 */
export const PUBLIC_HOSTS = [
  "hopefdn.org",
  "www.hopefdn.org",
  "hope.castle-murray.com",
] as const;

export type PublicHost = (typeof PUBLIC_HOSTS)[number];

/** Preferred canonical host for OG tags / fallbacks when env is unset. */
export const PRIMARY_PUBLIC_HOST: PublicHost = "hopefdn.org";

export function publicOrigins(
  hosts: readonly string[] = PUBLIC_HOSTS,
): string[] {
  return hosts.flatMap((host) => [`https://${host}`, `http://${host}`]);
}
