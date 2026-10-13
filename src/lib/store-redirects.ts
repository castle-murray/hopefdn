/**
 * Redirects a set of retired URL paths (and common guesses) to /legacy so old
 * links and bookmarks never 404. Temporary (302) so browsers don't cache it.
 */
export const STORE_COMING_SOON_PATH = "/legacy";

const OLD_STORE_PATH =
  /^\/(?:legacy\/.+|admin\/(?:shop|orders)(?:\/.*)?|(?:shop|store|cart|checkout|merch|products?|orders?)(?:\/.*)?)$/i;

export function isOldStorePath(pathname: string): boolean {
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  return OLD_STORE_PATH.test(path);
}
