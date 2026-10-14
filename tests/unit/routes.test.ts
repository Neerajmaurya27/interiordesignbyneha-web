import { describe, expect, it } from 'vitest';
import { hasMenuDestinations, routeExists, routesFromFiles } from '../../src/lib/routes';

const files = [
  '/src/pages/index.astro',
  '/src/pages/404.astro',
  '/src/pages/projects/index.astro',
  '/src/pages/projects/[slug].astro',
  '/src/pages/enquire/thank-you.astro',
  '/src/pages/privacy.md',
];

describe('routesFromFiles', () => {
  it('maps page files to route paths', () => {
    expect([...routesFromFiles(files)].sort()).toEqual(
      ['/', '/404', '/enquire/thank-you', '/privacy', '/projects', '/projects/[slug]'].sort(),
    );
  });
});

describe('routeExists (production)', () => {
  const routes = routesFromFiles(files);
  it.each([
    ['/', true],
    ['/projects', true],
    ['/projects/', true],
    ['/privacy#rights', true],
    ['/enquire?type=villa', false],
    ['/approach', false],
  ])('%s → %s', (href, expected) => {
    expect(routeExists(href, routes, false)).toBe(expected);
  });

  it('shows every link in dev', () => {
    expect(routeExists('/approach', routes, true)).toBe(true);
  });
});

describe('hasMenuDestinations', () => {
  const primary = [{ href: '/projects' }, { href: '/studio' }];
  const cta = { href: '/enquire' };

  it('is false in production before any destination page exists', () => {
    expect(
      hasMenuDestinations(primary, cta, routesFromFiles(['/src/pages/404.astro']), false),
    ).toBe(false);
  });

  it('is true once one primary page or the enquiry page exists', () => {
    expect(
      hasMenuDestinations(primary, cta, routesFromFiles(['/src/pages/studio.astro']), false),
    ).toBe(true);
    expect(
      hasMenuDestinations(primary, cta, routesFromFiles(['/src/pages/enquire.astro']), false),
    ).toBe(true);
  });
});
