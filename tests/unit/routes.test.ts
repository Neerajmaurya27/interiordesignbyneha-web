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

import { applyContentGates, countPublished } from '../../src/lib/routes';

describe('content-gated routes', () => {
  it('treats [...index] files as the folder index', () => {
    expect(routesFromFiles(['/src/pages/projects/[...index].astro']).has('/projects')).toBe(true);
  });

  it('drops gated routes until content is published', () => {
    const routes = routesFromFiles([
      '/src/pages/projects/[...index].astro',
      '/src/pages/studio.astro',
    ]);
    expect([...applyContentGates(routes, { '/projects': false })]).toEqual(['/studio']);
  });

  it('counts only published, verified projects', () => {
    const fm = (body: string) => `---\n${body}\n---\n`;
    expect(
      countPublished([
        fm('title: A\npublished: true\nverified:\n  facts: true\n  credits: true'),
        fm('title: B\npublished: false\nverified:\n  facts: false\n  credits: false'),
        fm('title: C\nverified:\n  facts: true\n  credits: true'),
      ]),
    ).toBe(1);
  });
});

import { isPublishedPage } from '../../src/lib/routes';

describe('isPublishedPage', () => {
  it('requires published: true in the frontmatter', () => {
    expect(isPublishedPage('---\ntitle: Approach\npublished: true\n---\nBody')).toBe(true);
    expect(isPublishedPage('---\ntitle: Approach\npublished: false\n---\nBody')).toBe(false);
    expect(isPublishedPage('---\ntitle: Approach\n---\nBody')).toBe(false);
    expect(isPublishedPage(undefined)).toBe(false);
  });
});
