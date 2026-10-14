# interiordesignbyneha — website

Static, photography-led site for an interior design studio working in Mumbai and Dubai.
Built with Astro 7, Tailwind CSS v4 and self-hosted Fraunces + Inter. It will be hosted on Cloudflare.
The full plan, including the register of facts still to be verified, is in
[docs/implementation-plan.md](docs/implementation-plan.md).

## Requirements

- Node 22.12 or later (`.nvmrc`)
- pnpm 10 (`corepack enable`)

## Commands

| Command             | What it does                                                                |
| ------------------- | --------------------------------------------------------------------------- |
| `pnpm dev`          | Dev server at http://localhost:4321; tokens at `/dev/tokens`                |
| `pnpm build`        | Production build to `dist/`, then the placeholder guard                     |
| `pnpm preview`      | Serve the production build                                                  |
| `pnpm check`        | Astro + TypeScript type check                                               |
| `pnpm lint`         | ESLint (TypeScript, Astro, jsx-a11y strict)                                 |
| `pnpm format:check` | Prettier                                                                    |
| `pnpm test`         | Unit tests (Vitest), including token contrast checks                        |
| `pnpm test:e2e`     | Playwright end-to-end tests (starts the dev server)                         |
| `pnpm launch:check` | After a build: fails until the home page has a real hero and published work |
| `pnpm verify`       | Everything above, as CI runs it                                             |

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

## Content rules

The portfolio contains real photographs of completed projects only. Any studio fact that is not yet
verified stays hidden, and the production build fails if `[VERIFY`, `TODO`, `lorem` or `placeholder`
text appears in the output (`scripts/check-placeholders.mjs`).
