/**
 * Pure project rules, shared by pages and unit tests (no astro:content import here).
 */

export type ProjectType = 'residence' | 'villa' | 'penthouse' | 'hospitality' | 'commercial';

export interface PublishFields {
  title: string;
  published: boolean;
  verified: { facts: boolean; credits: boolean };
}

export interface FactFields {
  locality?: string | undefined;
  city: string;
  type: ProjectType;
  areaSqft?: number | undefined;
  year: number;
}

export const TYPE_LABELS: Record<ProjectType, string> = {
  residence: 'Residence',
  villa: 'Villa',
  penthouse: 'Penthouse',
  hospitality: 'Hospitality',
  commercial: 'Commercial',
};

/**
 * Production gate. A project ships only when published with verified facts and credits.
 * Publishing an unverified project is a mistake worth stopping the build for, so it throws.
 */
export function isPublishable(project: PublishFields): boolean {
  if (!project.published) return false;
  const missing = [
    !project.verified.facts && 'verified.facts',
    !project.verified.credits && 'verified.credits',
  ].filter(Boolean);
  if (missing.length > 0) {
    throw new Error(
      `Project "${project.title}" is published but ${missing.join(' and ')} is false. ` +
        'Verify it with the studio or set published: false.',
    );
  }
  return true;
}

/** "{locality}, {city} · {type} · {areaSqft} sq ft · {year}", skipping missing parts. */
export function factsLine(p: FactFields): string {
  const place = p.locality ? `${p.locality}, ${p.city}` : p.city;
  const area = p.areaSqft ? `${p.areaSqft.toLocaleString('en-IN')} sq ft` : null;
  return [place, TYPE_LABELS[p.type], area, String(p.year)].filter(Boolean).join(' · ');
}

/** Featured projects for the home page, in homeOrder, at most `limit`. */
export function featuredForHome<T extends { featured: boolean; homeOrder?: number | undefined }>(
  projects: T[],
  limit = 3,
): T[] {
  return projects
    .filter((p) => p.featured)
    .sort((a, b) => (a.homeOrder ?? Infinity) - (b.homeOrder ?? Infinity))
    .slice(0, limit);
}

/** Index card line: "City · Type · Area · Year" (brief §8). */
export function cardFacts(p: FactFields): string {
  const area = p.areaSqft ? `${p.areaSqft.toLocaleString('en-IN')} sq ft` : null;
  return [p.city, TYPE_LABELS[p.type], area, String(p.year)].filter(Boolean).join(' · ');
}

export interface RelatedFields {
  slug: string;
  region: string;
  type: ProjectType;
  indexOrder: number;
  related: string[];
}

/**
 * Two related projects: explicit `related` slugs first, then same city, then same type, in index
 * order. Never the project itself, never duplicates.
 */
export function relatedFor<T extends RelatedFields>(project: T, all: T[], limit = 2): T[] {
  const others = all
    .filter((p) => p.slug !== project.slug)
    .sort((a, b) => a.indexOrder - b.indexOrder);
  const explicit = project.related
    .map((slug) => others.find((p) => p.slug === slug))
    .filter((p): p is T => p !== undefined);
  const sameCity = others.filter((p) => p.region === project.region);
  const sameType = others.filter((p) => p.type === project.type);
  const picked: T[] = [];
  for (const candidate of [...explicit, ...sameCity, ...sameType]) {
    if (picked.length >= limit) break;
    if (!picked.includes(candidate)) picked.push(candidate);
  }
  return picked;
}

/** The next project in index order, wrapping to the first. Null when there is only one. */
export function nextProject<T extends { slug: string; indexOrder: number }>(
  project: T,
  all: T[],
): T | null {
  const ordered = [...all].sort((a, b) => a.indexOrder - b.indexOrder);
  if (ordered.length < 2) return null;
  const i = ordered.findIndex((p) => p.slug === project.slug);
  return ordered[(i + 1) % ordered.length] ?? null;
}

/** Enquiry form project-type values (brief §12). */
export const ENQUIRY_TYPE: Record<ProjectType, string> = {
  residence: 'apartment',
  penthouse: 'apartment',
  villa: 'villa',
  hospitality: 'hospitality',
  commercial: 'commercial',
};

/** Prefilled enquiry link for a case study: /enquire?type=&city=&project= */
export function enquiryHref(p: { type: ProjectType; region: string; slug: string }): string {
  const params = new URLSearchParams({
    type: ENQUIRY_TYPE[p.type],
    city: p.region,
    project: p.slug,
  });
  return `/enquire?${params.toString()}`;
}

/** Index filter groups (brief §8). Values are what appears in the URL query. */
export const TYPE_FILTERS = [
  { value: 'residences', label: 'Residences', types: ['residence', 'villa', 'penthouse'] },
  {
    value: 'hospitality-commercial',
    label: 'Hospitality & commercial',
    types: ['hospitality', 'commercial'],
  },
] as const satisfies readonly { value: string; label: string; types: readonly ProjectType[] }[];

export const CITY_FILTERS = [
  { value: 'mumbai', label: 'Mumbai' },
  { value: 'dubai', label: 'Dubai' },
] as const;

export const MIN_PER_FILTER = 3;

export function typeGroup(type: ProjectType): string {
  return TYPE_FILTERS.find((f) => (f.types as readonly ProjectType[]).includes(type))!.value;
}

/** Filter options that have at least MIN_PER_FILTER projects; others are hidden. */
export function availableFilters(projects: { type: ProjectType; region: string }[]) {
  const types = TYPE_FILTERS.filter(
    (f) => projects.filter((p) => typeGroup(p.type) === f.value).length >= MIN_PER_FILTER,
  );
  const cities = CITY_FILTERS.filter(
    (f) => projects.filter((p) => p.region === f.value).length >= MIN_PER_FILTER,
  );
  return { types, cities };
}

/**
 * Editorial grid rhythm (brief §8): one full-width landscape, then two portraits, then three
 * 4:5 tiles, repeating — so each row uses a single ratio.
 */
export type CardShape = 'full' | 'portrait' | 'tile';
const RHYTHM: CardShape[] = ['full', 'portrait', 'portrait', 'tile', 'tile', 'tile'];

export function shapeFor(index: number): CardShape {
  return RHYTHM[index % RHYTHM.length]!;
}
