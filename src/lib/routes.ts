/**
 * Knows which routes the site actually has, so navigation never links to a page that does not
 * exist yet ("no button without a working destination"). Pages are discovered from src/pages at
 * build time without importing them.
 *
 * In `astro dev` every configured link is shown, so the full navigation can be designed before
 * all pages exist. Production builds only link to real routes.
 */

import { parse } from 'yaml';
import { isPublishable } from './project-rules';

const pageFiles = Object.keys(import.meta.glob('/src/pages/**/*.{astro,md,mdx,html}'));

/**
 * Routes that exist only once content is published. Read from project frontmatter without
 * importing images, so this stays synchronous for components.
 */
const projectSources = import.meta.glob<string>('/src/content/projects/*/index.md', {
  query: '?raw',
  import: 'default',
  eager: true,
});

export function countPublished(sources: string[]): number {
  return sources.filter((raw) => {
    const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (!match) return false;
    const data = parse(match[1]!) as Parameters<typeof isPublishable>[0];
    return data?.published === true && isPublishable(data);
  }).length;
}

const pageSources = import.meta.glob<string>('/src/content/pages/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
});

/** True when a page file's frontmatter says `published: true`. */
export function isPublishedPage(raw: string | undefined): boolean {
  const match = raw?.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return false;
  return (parse(match[1]!) as { published?: unknown } | null)?.published === true;
}

const hasPublishedProjects = countPublished(Object.values(projectSources)) > 0;
const contentGates: Record<string, boolean> = {
  '/projects': hasPublishedProjects,
  '/projects/[slug]': hasPublishedProjects,
  '/approach': isPublishedPage(pageSources['/src/content/pages/approach.md']),
  '/studio': isPublishedPage(pageSources['/src/content/pages/studio.md']),
  '/privacy': isPublishedPage(pageSources['/src/content/pages/privacy.md']),
  // The enquiry form is linked only once its accounts are live (set at build time) [V25].
  '/enquire': import.meta.env.PUBLIC_ENQUIRY_ENABLED === 'true',
};

/** Converts src/pages file paths to route paths. Dynamic segments become "[param]". */
export function routesFromFiles(files: string[]): Set<string> {
  const routes = new Set<string>();
  for (const file of files) {
    const route = file
      .replace(/^\/src\/pages/, '')
      .replace(/\.(astro|md|mdx|html)$/, '')
      // "[...index]" files render their folder's index page (generated only when content exists).
      .replace(/\/(index|\[\.\.\.index\])$/, '');
    routes.add(route === '' ? '/' : route);
  }
  return routes;
}

/** Removes routes whose content is not published yet. */
export function applyContentGates(
  routes: Set<string>,
  gates: Record<string, boolean>,
): Set<string> {
  return new Set([...routes].filter((route) => gates[route] ?? true));
}

const routes = applyContentGates(routesFromFiles(pageFiles), contentGates);

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
