/**
 * SSO providers — intentionally empty.
 * This site uses username + password only (no Google / X / OAuth).
 */
export type GrokProvider = {
  providerId: string;
  idp: string;
  label: string;
};

export const GROK_PROVIDERS: readonly GrokProvider[] = [];
