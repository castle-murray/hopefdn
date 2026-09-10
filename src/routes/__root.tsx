import {
  createRootRoute,
  HeadContent,
  Outlet,
  Scripts,
} from "@tanstack/react-router";
import { AuthProvider } from "@/lib/auth/provider";
import { CreatedWithGrokBanner } from "@/components/created-with-grok-banner";
import { SiteShell } from "@/components/layout/site-shell";
import { NotFoundComponent } from "@/components/not-found";
import appCss from "../styles.css?url";
import cormorant600 from "@fontsource/cormorant-garamond/files/cormorant-garamond-latin-600-normal.woff2?url";
import sourceSans400 from "@fontsource/source-sans-3/files/source-sans-3-latin-400-normal.woff2?url";

const APP_NAME = "H.O.P.E. Foundation, Inc.";
const APP_DESCRIPTION =
  "Helping Others. Pursuing Excellence. Building legacy through compassion, dignity & community across Hampton Roads.";
const host = import.meta.env.VITE_PUBLIC_HOSTNAME;
const ogImage = host
  ? `https://${host}/og.jpg`
  : undefined;

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: APP_NAME },
      { name: "description", content: APP_DESCRIPTION },
      { name: "apple-mobile-web-app-title", content: "H.O.P.E. Foundation" },
      { name: "theme-color", content: "#0b1d3a" },
      ...(ogImage
        ? [
            { property: "og:image", content: ogImage },
            { property: "og:image:width", content: "1200" },
            { property: "og:image:height", content: "630" },
          ]
        : []),
      { property: "og:title", content: APP_NAME },
      { property: "og:description", content: APP_DESCRIPTION },
    ],
    links: [
      { rel: "icon", type: "image/png", href: "/favicon-64.png" },
      { rel: "icon", type: "image/webp", href: "/images/hope-mark-w160.webp" },
      // Kick off CSS early; still apply as stylesheet for correct cascade.
      { rel: "preload", href: appCss, as: "style" },
      { rel: "stylesheet", href: appCss },
      // Critical self-hosted fonts (same-origin) — no fonts.googleapis.com round-trip.
      {
        rel: "preload",
        href: sourceSans400,
        as: "font",
        type: "font/woff2",
        crossOrigin: "anonymous",
      },
      {
        rel: "preload",
        href: cormorant600,
        as: "font",
        type: "font/woff2",
        crossOrigin: "anonymous",
      },
      { rel: "manifest", href: "/__grok/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
    ],
  }),
  component: RootDocument,
  notFoundComponent: NotFoundComponent,
});

function RootDocument() {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        <CreatedWithGrokBanner />
        <AuthProvider>
          <SiteShell>
            <Outlet />
          </SiteShell>
        </AuthProvider>
        <Scripts />
      </body>
    </html>
  );
}
