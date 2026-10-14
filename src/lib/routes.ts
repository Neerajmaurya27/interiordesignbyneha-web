/**
 * Knows which routes the site actually has, so navigation never links to a page that does not
 * exist yet ("no button without a working destination"). Pages are discovered from src/pages at
 * build time without importing them.
 *
 * In `astro dev` every configured link is shown, so the full navigation can be designed before
 * all pages exist. Production builds only link to real routes.
 */

const pageFiles = Object.keys(import.meta.glob('/src/pages/**/*.{astro,md,mdx,html}'));

/** Converts src/pages file paths to route paths. Dynamic segments become "[param]". */
export function routesFromFiles(files: string[]): Set<string> {
  const routes = new Set<string>();
  for (const file of files) {
    const route = file
      .replace(/^\/src\/pages/, '')
      .replace(/\.(astro|md|mdx|html)$/, '')
      .replace(/\/index$/, '');
    routes.add(route === '' ? '/' : route);
  }
  return routes;
}

const routes = routesFromFiles(pageFiles);

export function routeExists(
  href: string,
  existing: Set<string> = routes,
  showAll: boolean = import.meta.env.DEV,
): boolean {
  if (showAll) return true;
  const path = href.split(/[?#]/)[0] || '/';
  const normalised = path.length > 1 ? path.replace(/\/$/, '') : path;
  return existing.has(normalised);
}

export function existingOnly<T extends { href: string }>(
  items: T[],
  existing: Set<string> = routes,
  showAll: boolean = import.meta.env.DEV,
): T[] {
  return items.filter((item) => routeExists(item.href, existing, showAll));
}

/**
 * The mobile menu (and its footer-nav fallback) only renders when it has somewhere to go:
 * at least one primary page or the enquiry page.
 */
export function hasMenuDestinations(
  primary: { href: string }[],
  cta: { href: string },
  existing: Set<string> = routes,
  showAll: boolean = import.meta.env.DEV,
): boolean {
  return (
    existingOnly(primary, existing, showAll).length > 0 || routeExists(cta.href, existing, showAll)
  );
}
