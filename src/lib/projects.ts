/**
 * Project queries. Production builds return only publishable projects from src/content/projects.
 * `astro dev` also returns the unpublished fixtures in src/fixtures/projects, marked `isFixture`,
 * so layouts can be built before real content arrives.
 */
import { getCollection, type CollectionEntry } from 'astro:content';
import { isPublishable } from './project-rules';
import { SHOW_FIXTURES } from './preview';

type ProjectData = CollectionEntry<'projects'>['data'];

export type Project = ProjectData & {
  slug: string;
  /** Folder that holds index.md, e.g. "/src/content/projects/worli-residence". */
  dir: string;
  /** Development-only fixture or unpublished draft: shown with a dev badge, never shipped. */
  isFixture: boolean;
};

function toProject(
  entry: { id: string; data: ProjectData },
  base: 'content' | 'fixtures',
  isFixture: boolean,
): Project {
  const data = { ...entry.data };
  // A testimonial ships only when verified and backed by a written-permission reference [V11].
  if (!isFixture && !(data.verified.testimonial && data.testimonial?.permissionRef)) {
    delete data.testimonial;
  }
  return { ...data, slug: entry.id, dir: `/src/${base}/projects/${entry.id}`, isFixture };
}

export async function getProjects(): Promise<Project[]> {
  const real = await getCollection('projects');
  const published = real
    .filter((entry) => isPublishable(entry.data))
    .map((entry) => toProject(entry, 'content', false));

  if (!SHOW_FIXTURES) return sortByIndex(published);

  const drafts = real
    .filter((entry) => !entry.data.published)
    .map((entry) => toProject(entry, 'content', true));
  const fixtures = (await getCollection('projectFixtures')).map((entry) =>
    toProject(entry, 'fixtures', true),
  );
  return sortByIndex([...published, ...drafts, ...fixtures]);
}

function sortByIndex(projects: Project[]): Project[] {
  return projects.sort((a, b) => a.indexOrder - b.indexOrder);
}

const planSvgs = import.meta.glob<string>('/src/{content,fixtures}/projects/*/*.svg', {
  query: '?raw',
  import: 'default',
  eager: true,
});

/** The project's floor-plan SVG markup, or null if the file is missing. */
export function planSvg(project: Project): string | null {
  if (!project.plan) return null;
  return planSvgs[`${project.dir}/${project.plan.svg}`] ?? null;
}
