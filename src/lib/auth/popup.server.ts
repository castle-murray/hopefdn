/**
 * Legacy live-preview OAuth popup handler.
 * SSO has been removed — this always returns a clear error page.
 * Kept so the Vite authPopupPlugin middleware does not crash if hit.
 */
export async function handleAuthPopupRequest(_request: Request): Promise<Response> {
  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"/><title>Sign-in unavailable</title></head>
<body style="font-family:system-ui;padding:2rem;max-width:28rem">
  <h1 style="font-size:1.25rem">SSO sign-in is disabled</h1>
  <p>This site uses username and password only. Close this window and use the staff sign-in page.</p>
  <script>try{if(window.opener)window.opener.postMessage({source:"grok-auth-popup",token:null,error:"sso_disabled"},window.location.origin)}catch(e){}</script>
</body></html>`;
  return new Response(html, {
    status: 410,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}
