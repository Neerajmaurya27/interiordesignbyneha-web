/**
 * Project queries. Production builds return only publishable projects from src/content/projects.
 * `astro dev` also returns the unpublished fixtures in src/fixtures/projects, marked `isFixture`,
 * so layouts can be built before real content arrives.
 */
import { getCollection, type CollectionEntry } from 'astro:content';
import { isPublishable } from './project-rules';

export type Project = CollectionEntry<'projects'>['data'] & {
  slug: string;
  /** Development-only fixture or unpublished draft: shown with a dev badge, never shipped. */
  isFixture: boolean;
};

export async function getProjects(): Promise<Project[]> {
  const real = await getCollection('projects');
  const published = real
    .filter((entry) => isPublishable(entry.data))
    .map((entry) => ({ ...entry.data, slug: entry.id, isFixture: false }));

  if (!import.meta.env.DEV) return sortByIndex(published);

  const drafts = real
    .filter((entry) => !entry.data.published)
    .map((entry) => ({ ...entry.data, slug: entry.id, isFixture: true }));
  const fixtures = (await getCollection('projectFixtures')).map((entry) => ({
    ...entry.data,
    slug: entry.id,
    isFixture: true,
  }));
  return sortByIndex([...published, ...drafts, ...fixtures]);
}

function sortByIndex(projects: Project[]): Project[] {
  return projects.sort((a, b) => a.indexOrder - b.indexOrder);
}
