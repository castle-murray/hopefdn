import type { Plugin } from "vite";
import { defineConfig, loadEnv } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { nitro } from "nitro/vite";

/**
 * Finish PGLite bootstrap during dev-server setup (before traffic). Vite awaits
 * async `configureServer` hooks. Production: `src/lib/db` kicks `ensureDbReady`
 * on import.
 */
function pgliteBootstrapPlugin(): Plugin {
  return {
    name: "app-builder:pglite-bootstrap",
    apply: "serve",
    async configureServer(server) {
      try {
        const mod = (await server.ssrLoadModule("/src/lib/db.ts")) as {
          ensureDbReady?: () => Promise<void>;
        };
        if (typeof mod.ensureDbReady === "function") {
          await mod.ensureDbReady();
        }
      } catch (err) {
        console.error("[app-builder] DB bootstrap failed:", err);
        throw err;
      }
    },
  };
}

/**
 * Live-preview OAuth popup — handled HERE so the agent never has to create a
 * `/auth/popup` route (and cannot break it by scaffolding a React page that
 * paints the full app shell in the popup).
 *
 * `signIn` (client.ts) opens `/auth/popup?providerId=…` in a top-level window.
 * This middleware runs before TanStack Start, calls `handleAuthPopupRequest`,
 * and returns the 302 / completion HTML. Deployed apps do not use the popup
 * (full-page OAuth redirect), so `apply: "serve"` is enough.
 */
function authPopupPlugin(): Plugin {
  return {
    name: "app-builder:auth-popup",
    apply: "serve",
    configureServer(server) {
      // Register immediately (not in a returned post-hook) so we run BEFORE
      // TanStack Start / the SPA HTML fallback. A model-authored
      // `src/routes/auth/popup.tsx` React page must never win this path.
      server.middlewares.use(async (req, res, next) => {
        try {
          const rawUrl = req.url ?? "";
          const pathOnly = rawUrl.split("?", 1)[0] ?? "";
          if (pathOnly !== "/auth/popup") {
            next();
            return;
          }
          if ((req.method ?? "GET").toUpperCase() !== "GET") {
            res.statusCode = 405;
            res.setHeader("content-type", "text/plain; charset=utf-8");
            res.end("Method Not Allowed");
            return;
          }

          const host = String(
            req.headers["x-forwarded-host"] ?? req.headers.host ?? "localhost:8080",
          );
          const proto = String(
            req.headers["x-forwarded-proto"] ??
              ((req.socket as { encrypted?: boolean } | undefined)?.encrypted ? "https" : "http"),
          );
          const requestHeaders = new Headers();
          for (const [key, value] of Object.entries(req.headers)) {
            if (value === undefined) continue;
            if (Array.isArray(value)) {
              for (const v of value) requestHeaders.append(key, v);
            } else {
              requestHeaders.set(key, value);
            }
          }
          // Ensure Host is the public preview host so Better Auth's dynamic
          // baseURL / redirect_uri match the popup origin.
          if (!requestHeaders.has("host")) requestHeaders.set("host", host);

          const request = new Request(`${proto}://${host}${rawUrl}`, {
            method: "GET",
            headers: requestHeaders,
          });

          const mod = (await server.ssrLoadModule("/src/lib/auth/popup.server.ts")) as {
            handleAuthPopupRequest: (req: Request) => Promise<Response>;
          };
          const response = await mod.handleAuthPopupRequest(request);

          res.statusCode = response.status;
          // Preserve multiple Set-Cookie headers (OAuth state + session).
          const setCookies =
            typeof response.headers.getSetCookie === "function"
              ? response.headers.getSetCookie()
              : [];
          response.headers.forEach((value, key) => {
            if (key.toLowerCase() === "set-cookie") return;
            res.setHeader(key, value);
          });
          for (const cookie of setCookies) {
            res.appendHeader("set-cookie", cookie);
          }
          const body = Buffer.from(await response.arrayBuffer());
          res.end(body);
        } catch (err) {
          console.error("[app-builder] /auth/popup handler failed:", err);
          if (!res.headersSent) {
            res.statusCode = 500;
            res.setHeader("content-type", "text/plain; charset=utf-8");
            res.end("auth popup failed");
          }
        }
      });
    },
  };
}

// `0.0.0.0:8080` is the live-preview contract — don't change host/port.
// Keep `nitro` gated to `build` (the Vercel deploy target): enabled in dev it
// opens a second dev-server port, which breaks the single-port preview.
// The dev server starts once `src/router.tsx` and `src/routes/` exist — see
// AGENTS.md § "First scaffold".
export default defineConfig(({ command, mode }) => {
  // Load all keys from .env* into process.env for server-side SMTP/auth (not only VITE_*).
  const fileEnv = loadEnv(mode, process.cwd(), "");
  for (const [key, value] of Object.entries(fileEnv)) {
    if (process.env[key] === undefined) process.env[key] = value;
  }

  // Public hostname for reverse-proxied dev (e.g. hope.castle-murray.com → :8080).
  // When server.host is 0.0.0.0, Vite defaults HMR to "localhost", which only
  // works on this machine — remote browsers must use the public host instead.
  const publicHostname = (
    process.env.VITE_PUBLIC_HOSTNAME ||
    fileEnv.VITE_PUBLIC_HOSTNAME ||
    "hope.castle-murray.com"
  ).trim();

  const hmrHost = (
    process.env.VITE_HMR_HOST ||
    fileEnv.VITE_HMR_HOST ||
    publicHostname
  ).trim();

  // ws + default port when the proxy is plain HTTP; set VITE_HMR_PROTOCOL=wss
  // and VITE_HMR_CLIENT_PORT=443 if the public site is HTTPS.
  const hmrProtocol = (
    process.env.VITE_HMR_PROTOCOL ||
    fileEnv.VITE_HMR_PROTOCOL ||
    "ws"
  )
    .trim()
    .replace(/:$/, "") as "ws" | "wss";

  const hmrClientPortRaw = (
    process.env.VITE_HMR_CLIENT_PORT ||
    fileEnv.VITE_HMR_CLIENT_PORT ||
    ""
  ).trim();
  // Without an explicit clientPort, Vite falls back to 8080 — remote browsers
  // then hit hope.castle-murray.com:8080 which is usually not exposed. Use the
  // public edge port instead (80/ws or 443/wss).
  const hmrClientPort = hmrClientPortRaw
    ? Number(hmrClientPortRaw)
    : hmrProtocol === "wss"
      ? 443
      : hmrHost && hmrHost !== "localhost" && !hmrHost.startsWith("127.")
        ? 80
        : undefined;

  return {
    server: {
      host: "0.0.0.0",
      port: 8080,
      strictPort: true,
      // Temporary exhibition host (reverse-proxied to this dev server).
      allowedHosts: [publicHostname, "hope.castle-murray.com", "localhost"],
      // HMR websocket must target the host the *browser* can reach — not
      // localhost — when viewing through a reverse proxy from another machine.
      // Reverse proxy must also forward WebSocket upgrades for this to work.
      // https://vite.dev/config/server-options.html#server-hmr
      hmr: {
        host: hmrHost,
        protocol: hmrProtocol,
        ...(hmrClientPort && Number.isFinite(hmrClientPort)
          ? { clientPort: hmrClientPort }
          : {}),
      },
    },
    resolve: { tsconfigPaths: true },
    plugins: [
      pgliteBootstrapPlugin(),
      // Before tanstackStart so /auth/popup never falls through to the SPA.
      authPopupPlugin(),
      tailwindcss(),
      tanstackStart(),
      ...(command === "build"
        ? [
            nitro({
              preset: "vercel",
            }),
          ]
        : []),
      viteReact(),
    ],
  };
});
