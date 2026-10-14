/**
 * Cookieless analytics events (brief §14). No personal data is ever sent: event names plus a few
 * coarse properties (page, city, project slug, chapter).
 *  - Clicks on [data-analytics] elements: cta_click {location}, whatsapp_click {city, page},
 *    phone_click, email_click, gallery_open {slug}
 *  - Custom "analytics" events from scripts: form_start, form_submit_success,
 *    form_submit_error {reason}, filter_change {type, city}
 *  - project_view {slug, city, type} on case studies; chapter_view {chapter} once per home chapter
 * Events go to Plausible when it is the configured provider; in development and preview builds
 * they are also collected on window.__analytics for tests.
 */
type Props = Record<string, string>;

declare global {
  interface Window {
    plausible?: ((name: string, options?: { props?: Props }) => void) & { q?: unknown[] };
    __analytics?: { name: string; props: Props }[];
  }
}

const config = document.querySelector<HTMLElement>('[data-analytics-config]')?.dataset ?? {};
const collect = config.collect === 'true';

function track(name: string, props: Props = {}) {
  const clean = Object.fromEntries(Object.entries(props).filter(([, v]) => v));
  if (collect) (window.__analytics ??= []).push({ name, props: clean });
  window.plausible?.(name, Object.keys(clean).length > 0 ? { props: clean } : undefined);
}

const page = window.location.pathname;
const project = document.querySelector<HTMLElement>('[data-project-slug]');

// Clicks (capture phase, so scripts that prevent navigation — e.g. the lightbox — are still seen).
document.addEventListener(
  'click',
  (event) => {
    const el = (event.target as Element | null)?.closest<HTMLElement>('[data-analytics]');
    if (!el) return;
    const name = el.dataset.analytics!;
    if (name === 'whatsapp_click') track(name, { city: el.dataset.city ?? '', page });
    else if (name === 'gallery_open') track(name, { slug: project?.dataset.projectSlug ?? '' });
    else if (name === 'cta_click') track(name, { location: el.dataset.location ?? '', page });
    else track(name, { page });
  },
  { capture: true },
);

// Events dispatched by other scripts.
document.addEventListener('analytics', (event) => {
  const { name, ...props } = (event as CustomEvent<{ name: string } & Props>).detail;
  track(name, props);
});

if (project) {
  track('project_view', {
    slug: project.dataset.projectSlug ?? '',
    city: project.dataset.projectCity ?? '',
    type: project.dataset.projectType ?? '',
  });
}

// Home chapters, once each.
const chapters = document.querySelectorAll<HTMLElement>('[data-chapter]');
if (chapters.length > 0 && page === '/') {
  const seen = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        track('chapter_view', { chapter: (entry.target as HTMLElement).dataset.chapter ?? '' });
        seen.unobserve(entry.target);
      }
    },
    // A chapter counts as viewed when it crosses the middle of the viewport (some are taller than
    // several screens, so a visible-fraction threshold would never be reached).
    { rootMargin: '-45% 0px -45% 0px' },
  );
  chapters.forEach((chapter) => seen.observe(chapter));
}

export {};
