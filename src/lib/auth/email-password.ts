/**
 * Local username/password sign-in (this app's Better Auth DB).
 * Public self-registration is always disabled — only superusers create accounts.
 *
 * Do NOT edit `server.ts` for the enable flag — flip `emailAndPasswordEnabled` here.
 */
export const emailAndPasswordEnabled = true;

/** Public /sign-up is closed; accounts are created by an admin only. */
export const publicSignUpDisabled = true;
