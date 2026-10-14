/**
 * Loaders for /approach and /studio. Production returns only published, consented, verified
 * content. `astro dev` falls back to the labelled fixtures in src/fixtures so the templates can be
 * reviewed before the studio's copy arrives.
 */
import { getCollection, getEntry, type CollectionEntry } from 'astro:content';
import { SHOW_FIXTURES } from './preview';

export interface Loaded<T> {
  value: T;
  isFixture: boolean;
}

type PageEntry = CollectionEntry<'pages'> | CollectionEntry<'pageFixtures'>;

export async function getPage(
  id: 'approach' | 'studio' | 'privacy',
): Promise<Loaded<PageEntry> | null> {
  const real = await getEntry('pages', id);
  if (real?.data.published) return { value: real, isFixture: false };
  if (!SHOW_FIXTURES) return null;
  // In development an unpublished draft is shown (marked), before falling back to a fixture.
  if (real) return { value: real, isFixture: true };
  const fixture = await getEntry('pageFixtures', id);
  return fixture ? { value: fixture, isFixture: true } : null;
}

export async function getFaq() {
  const real = (await getCollection('faq')).filter((e) => e.data.published).map((e) => e.data);
  if (real.length > 0 || !SHOW_FIXTURES) {
    return { value: real.sort((a, b) => a.order - b.order), isFixture: false };
  }
  const fixtures = (await getCollection('faqFixtures')).map((e) => e.data);
  return { value: fixtures.sort((a, b) => a.order - b.order), isFixture: fixtures.length > 0 };
}

type TeamEntry = CollectionEntry<'team'> | CollectionEntry<'teamFixtures'>;

export async function getTeam(): Promise<Loaded<TeamEntry[]>> {
  const real = (await getCollection('team')).filter((e) => e.data.consent && e.data.published);
  if (real.length > 0 || !SHOW_FIXTURES) {
    return { value: real.sort((a, b) => a.data.order - b.data.order), isFixture: false };
  }
  const fixtures = await getCollection('teamFixtures');
  return {
    value: fixtures.sort((a, b) => a.data.order - b.data.order),
    isFixture: fixtures.length > 0,
  };
}

export interface PressEntry {
  publication: string;
  title: string;
  year: number;
  url?: string | undefined;
}

export async function getPress(): Promise<Loaded<PressEntry[]>> {
  const real = (await getCollection('press'))
    .filter((p) => p.data.verified)
    .map((p) => p.data)
    .sort((a, b) => b.year - a.year);
  if (real.length > 0 || !SHOW_FIXTURES) return { value: real, isFixture: false };
  const { sampleCredibility } = await import('../fixtures/home/sample');
  return { value: sampleCredibility.press, isFixture: true };
}
