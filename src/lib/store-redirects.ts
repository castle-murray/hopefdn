/**
 * The online store was removed from the site. Old store URLs (and the common
 * store paths people guess) redirect to the Coming Soon page at /legacy.
 *
 * Only /legacy, /admin/shop and /admin/orders ever existed here; the rest are
 * catch-alls so old links and bookmarks never 404. Temporary (302) on purpose,
 * so browsers don't cache it if a store returns on one of these paths.
 */
export const STORE_COMING_SOON_PATH = "/legacy";

const OLD_STORE_PATH =
  /^\/(?:legacy\/.+|admin\/(?:shop|orders)(?:\/.*)?|(?:shop|store|cart|checkout|merch|products?|orders?)(?:\/.*)?)$/i;

export function isOldStorePath(pathname: string): boolean {
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  return OLD_STORE_PATH.test(path);
}
