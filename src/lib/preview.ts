/**
 * Whether this build shows development fixtures and sample copy.
 * - `astro dev`: always.
 * - Preview builds (`pnpm build:preview`, PUBLIC_SHOW_FIXTURES=true): the production bundle with
 *   fixtures, for PR previews, Lighthouse, link checks and visual review. Every page is noindex.
 * - Production builds: never. The production deploy must not set PUBLIC_SHOW_FIXTURES.
 */
export const SHOW_FIXTURES: boolean =
  import.meta.env.DEV || import.meta.env.PUBLIC_SHOW_FIXTURES === 'true';

/** A built (non-dev) preview with fixtures: must not be indexed. */
export const IS_PREVIEW_BUILD: boolean =
  !import.meta.env.DEV && import.meta.env.PUBLIC_SHOW_FIXTURES === 'true';
