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
