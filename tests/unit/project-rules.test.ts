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
