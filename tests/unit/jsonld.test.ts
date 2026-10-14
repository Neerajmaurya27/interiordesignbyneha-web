import { describe, expect, it } from 'vitest';
import { breadcrumbJsonLd, organizationJsonLd, serializeJsonLd } from '../../src/lib/jsonld';
import { site, type SiteSettings } from '../../src/data/site';

const url = 'https://studio.test/';

describe('organizationJsonLd', () => {
  it('emits no LocalBusiness and no empty fields while offices are unverified', () => {
    const data = organizationJsonLd(site, url);
    const graph = data['@graph'] as Record<string, unknown>[];
    expect(graph).toHaveLength(1);
    expect(graph[0]).toEqual({
      '@type': 'Organization',
      '@id': 'https://studio.test/#organization',
      additionalType: 'https://en.wikipedia.org/wiki/Interior_design',
      name: 'interiordesignbyneha',
      url,
    });
  });

  it('adds a LocalBusiness only for an office with a real address', () => {
    const withAddress: SiteSettings = {
      ...site,
      offices: [{ ...site.offices[0]!, address: '1 Test Road', phone: '+91 00000 00000' }],
    };
    const graph = organizationJsonLd(withAddress, url)['@graph'] as Record<string, unknown>[];
    expect(graph).toHaveLength(2);
    expect(graph[1]).toMatchObject({
      '@type': ['LocalBusiness', 'ProfessionalService'],
      telephone: '+91 00000 00000',
      address: { streetAddress: '1 Test Road', addressLocality: 'Mumbai' },
    });
    expect(graph[1]).not.toHaveProperty('email');
  });
});

describe('breadcrumbJsonLd', () => {
  it('numbers items and resolves absolute URLs', () => {
    expect(
      breadcrumbJsonLd(
        [
          { name: 'Projects', href: '/projects' },
          { name: 'Worli residence', href: '/projects/worli' },
        ],
        url,
      ).itemListElement,
    ).toEqual([
      { '@type': 'ListItem', position: 1, name: 'Projects', item: 'https://studio.test/projects' },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Worli residence',
        item: 'https://studio.test/projects/worli',
      },
    ]);
  });
});

describe('serializeJsonLd', () => {
  it('escapes "<" so a value cannot close the script tag', () => {
    expect(serializeJsonLd({ name: '</script><script>' })).not.toContain('</script>');
  });
});
