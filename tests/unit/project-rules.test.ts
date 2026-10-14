import { describe, expect, it } from 'vitest';
import { factsLine, featuredForHome, isPublishable } from '../../src/lib/project-rules';

describe('isPublishable', () => {
  const base = { title: 'Test', published: true, verified: { facts: true, credits: true } };

  it('allows published projects with verified facts and credits', () => {
    expect(isPublishable(base)).toBe(true);
  });

  it('skips unpublished projects', () => {
    expect(
      isPublishable({ ...base, published: false, verified: { facts: false, credits: false } }),
    ).toBe(false);
  });

  it('stops the build when a published project is unverified', () => {
    expect(() => isPublishable({ ...base, verified: { facts: false, credits: true } })).toThrow(
      /verified\.facts is false/,
    );
    expect(() => isPublishable({ ...base, verified: { facts: true, credits: false } })).toThrow(
      /verified\.credits is false/,
    );
  });
});

describe('factsLine', () => {
  it('formats every part', () => {
    expect(
      factsLine({
        locality: 'Worli',
        city: 'Mumbai',
        type: 'residence',
        areaSqft: 4200,
        year: 2025,
      }),
    ).toBe('Worli, Mumbai · Residence · 4,200 sq ft · 2025');
  });

  it('skips missing locality and area', () => {
    expect(factsLine({ city: 'Dubai', type: 'villa', year: 2024 })).toBe('Dubai · Villa · 2024');
  });
});

describe('featuredForHome', () => {
  it('returns featured projects in homeOrder, capped', () => {
    const items = [
      { id: 'a', featured: true, homeOrder: 3 },
      { id: 'b', featured: false, homeOrder: 1 },
      { id: 'c', featured: true, homeOrder: 1 },
      { id: 'd', featured: true },
      { id: 'e', featured: true, homeOrder: 2 },
    ];
    expect(featuredForHome(items).map((p) => p.id)).toEqual(['c', 'e', 'a']);
  });
});

import {
  availableFilters,
  cardFacts,
  enquiryHref,
  nextProject,
  relatedFor,
  shapeFor,
} from '../../src/lib/project-rules';

const p = (
  slug: string,
  region: string,
  type: 'residence' | 'villa' | 'hospitality',
  indexOrder: number,
  related: string[] = [],
) => ({
  slug,
  region,
  type,
  indexOrder,
  related,
});

describe('relatedFor', () => {
  const all = [
    p('a', 'mumbai', 'residence', 1, ['d']),
    p('b', 'dubai', 'villa', 2),
    p('c', 'mumbai', 'villa', 3),
    p('d', 'dubai', 'hospitality', 4),
    p('e', 'mumbai', 'residence', 5),
  ];

  it('prefers explicit related, then same city', () => {
    expect(relatedFor(all[0]!, all).map((x) => x.slug)).toEqual(['d', 'c']);
  });

  it('falls back to same type and never returns itself', () => {
    expect(relatedFor(all[3]!, all).map((x) => x.slug)).toEqual(['b']);
  });
});

describe('nextProject', () => {
  const all = [p('a', 'mumbai', 'residence', 1), p('b', 'dubai', 'villa', 2)];
  it('wraps around', () => {
    expect(nextProject(all[1]!, all)?.slug).toBe('a');
  });
  it('is null with a single project', () => {
    expect(nextProject(all[0]!, [all[0]!])).toBeNull();
  });
});

describe('enquiryHref', () => {
  it('prefills type, city and project', () => {
    expect(enquiryHref({ type: 'penthouse', region: 'dubai', slug: 'palm-penthouse' })).toBe(
      '/enquire?type=apartment&city=dubai&project=palm-penthouse',
    );
  });
});

describe('cardFacts', () => {
  it('omits locality and missing area', () => {
    expect(cardFacts({ locality: 'Worli', city: 'Mumbai', type: 'villa', year: 2024 })).toBe(
      'Mumbai · Villa · 2024',
    );
  });
});

describe('availableFilters', () => {
  it('only offers options with at least three projects', () => {
    const projects = [
      ...Array.from({ length: 3 }, () => ({ type: 'residence' as const, region: 'mumbai' })),
      { type: 'hospitality' as const, region: 'dubai' },
      { type: 'villa' as const, region: 'dubai' },
    ];
    const { types, cities } = availableFilters(projects);
    expect(types.map((t) => t.value)).toEqual(['residences']);
    expect(cities.map((c) => c.value)).toEqual(['mumbai']);
  });
});

describe('shapeFor', () => {
  it('cycles full → two portraits → three tiles', () => {
    expect(Array.from({ length: 8 }, (_, i) => shapeFor(i))).toEqual([
      'full',
      'portrait',
      'portrait',
      'tile',
      'tile',
      'tile',
      'full',
      'portrait',
    ]);
  });
});
