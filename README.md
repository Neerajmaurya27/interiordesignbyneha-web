# interiordesignbyneha — website

Static, photography-led site for an interior design studio working in Mumbai and Dubai.
Built with Astro 7, Tailwind CSS v4 and self-hosted Fraunces + Inter. It will be hosted on Cloudflare.
The full plan, including the register of facts still to be verified, is in
[docs/implementation-plan.md](docs/implementation-plan.md).

## Requirements

- Node 22.12 or later (`.nvmrc`)
- pnpm 10 (`corepack enable`)

## Commands

| Command                   | What it does                                                                              |
| ------------------------- | ----------------------------------------------------------------------------------------- |
| `pnpm dev`                | Dev server at http://localhost:4321; tokens at `/dev/tokens`                              |
| `pnpm build`              | Production build, then placeholder guard, image audit and internal link check             |
| `pnpm build:preview`      | Production bundle with fixtures (noindex) for PR previews, Lighthouse and link checks     |
| `pnpm preview`            | Serve the production build                                                                |
| `pnpm check`              | Astro + TypeScript type check                                                             |
| `pnpm lint`               | ESLint (TypeScript, Astro, jsx-a11y strict)                                               |
| `pnpm format:check`       | Prettier                                                                                  |
| `pnpm test`               | Unit tests (Vitest), including token contrast checks                                      |
| `pnpm test:e2e`           | Playwright end-to-end tests (starts the dev server)                                       |
| `pnpm launch:check`       | After a build: fails until hero, published work, enquiry form and privacy notice are live |
| `pnpm assets`             | Asset inventory per project (`--fixtures` for a dry run)                                  |
| `pnpm lighthouse`         | Lighthouse CI on the preview build (mobile budgets; run `pnpm build:preview` first)       |
| `pnpm test:visual:update` | Regenerate visual baselines (on Linux, as in CI)                                          |
| `pnpm verify`             | Everything above, as CI runs it                                                           |

## Design system

- **Tokens:** `src/styles/tokens.css` (Tailwind `@theme static`). Tailwind's default colours,
  font sizes, breakpoints, radii and shadows are removed, so only brand values exist.
- **Motion:** `src/styles/motion.css`. Once-only fades, no animation library, reduced motion honoured.
- **Global styles:** `src/styles/global.css` (base type, focus rings, `.grid-page` 4/8/12 grid).
- **Components:** `src/components/ui/`
  - `Button`, `TextLink`, `ChapterLabel`
  - `Picture` (art-directed AVIF/WebP/JPEG)
  - `Field`, `ChoiceCard`
- **Fonts:** loaded via the Astro Fonts API (`astro.config.mjs`). Two WOFF2 files; Fraunces is preloaded.
  Metric-matched fallbacks are generated automatically.
- **Dev reference pages:** `src/dev/tokens.astro` (`/dev/tokens`) and `src/dev/layout.astro`
  (`/dev/layout`, the shell test page) are mounted during `pnpm dev` only.

## Site shell

- `src/layouts/BaseLayout.astro` wraps every page in the head metadata, skip link, header, mobile
  menu, footer and sticky mobile enquiry bar. Pass `overHero` when a page opens with a full-bleed hero.
- `src/data/site.ts` holds studio facts. Unverified values are `null` and the UI omits them.
- `src/lib/routes.ts` makes navigation link only to pages that exist in production builds. In
  `pnpm dev` every link shows, so the full navigation can be reviewed early.

## Home page and content

- `src/pages/index.astro` renders the seven chapters in order; each renders only when its content
  exists. Copy lives in `src/data/home.ts` (verified only); projects in `src/content/projects/`.
- In `pnpm dev`, empty chapters are filled from `src/fixtures/` (labelled flat-colour images and the
  brief's sample copy, marked `[VERIFY]`) and a "Dev preview" tag is shown. Production builds never
  include fixtures or sample copy.

## Projects

- `/projects` and `/projects/<slug>` are generated only once a project is published with verified
  facts and credits; until then navigation does not link to them.
- The case-study template (`src/layouts/ProjectLayout.astro`) renders optional blocks — plan,
  before/after, testimonial, craft, execution — only when the project has them.
- `src/fixtures/projects/fixture-a` exercises every block; `fixture-b` is minimal.

## Approach and Studio

- `/approach` and `/studio` are generated (and linked) only once `src/content/pages/approach.md`
  or `studio.md` exists with `published: true`.
- Sections render only with confirmed content: services per city (`servicesByCity` in
  `src/data/site.ts`), process (`src/data/home.ts`), FAQ (`src/content/faq`), team with consent
  (`src/content/team`), craft partners (`craftPartners` in `site.ts`) and verified press.

## Enquiry form

- `/enquire` is the only on-demand route (Cloudflare Worker); everything else is prerendered.
  It works without JavaScript (plain POST, re-rendered with errors) and with it (in-page send).
- Order of checks: honeypot → validation → minimum time to submit → Turnstile → studio email and
  lead store (either one succeeding keeps the lead) → confirmation to the enquirer.
- Configure with the variables in `.env.example`. Until `PUBLIC_ENQUIRY_ENABLED=true` and the
  services are set, nothing links to `/enquire` and it answers 404.
- Local development: `ENQUIRY_MOCK=true pnpm dev` logs enquiries instead of sending them.
- `pnpm build && pnpm preview` runs the production build in the Workers runtime (put secrets in
  `.dev.vars`).

## Responsive and motion

- `tests/e2e/responsive.spec.ts` checks every page at 360, 390, 768, 1024, 1440 and 1920px: no
  horizontal scroll or overflowing elements, tap targets of at least 24px on phones (standalone
  links use the 44px `.tap` class), unique view-transition names, sticky elements on desktop only.
- `tests/e2e/motion.spec.ts` checks the card → case-study view transition runs, and that reduced
  motion removes it and every transform.
- Heights use `svh` inside `@supports`, with `vh` for older Safari.
- Real-device checks that cannot be automated: [docs/device-testing.md](docs/device-testing.md).

## Quality gates (CI)

`.github/workflows/ci.yml` runs on every pull request and on `main`:

1. Type check, lint, format, unit tests, production build (placeholder guard, image audit,
   internal links).
2. Playwright: functional e2e, axe (WCAG 2.2 AA, zero violations) on every route and in open
   dialogs, responsive sweep, motion and reduced motion, analytics events, and visual regression
   at 390/768/1440px (baselines in `tests/e2e/visual.spec.ts-snapshots`).
3. Preview build → Lighthouse CI (mobile: performance ≥ 0.9, LCP ≤ 2.5s, CLS ≤ 0.1, TBT ≤ 200ms,
   JS ≤ 30 KB, CSS ≤ 40 KB, ≤ 5 fonts) and lychee (internal and external links).

`.github/workflows/deploy.yml`: pull requests upload a Cloudflare preview (fixtures, noindex,
robots disallow); `main` deploys the production build. Both wait for the `CLOUDFLARE_API_TOKEN`
and `CLOUDFLARE_ACCOUNT_ID` secrets; public settings come from repository variables (`SITE_URL`,
`PUBLIC_ENQUIRY_ENABLED`, `PUBLIC_TURNSTILE_SITE_KEY`, `PUBLIC_ANALYTICS_*`).

## SEO and analytics

- Unique title, description, canonical and Open Graph tags per page; JSON-LD for the studio, each
  case study (CreativeWork) and breadcrumbs. `sitemap-index.xml` lists indexable pages only;
  `robots.txt` allows crawling and points to it (preview builds disallow everything).
- Cookieless analytics (`PUBLIC_ANALYTICS_PROVIDER`: none, plausible, cloudflare). Events per
  brief §14 are wired through `data-analytics` attributes and `src/scripts/analytics.ts`; no
  personal data is sent.

## Content rules

The portfolio contains real photographs of completed projects only. Any studio fact that is not yet
verified stays hidden, and the production build fails if `[VERIFY`, `TODO`, `lorem` or `placeholder`
text appears in the output (`scripts/check-placeholders.mjs`).
