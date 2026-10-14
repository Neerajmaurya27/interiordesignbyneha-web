# interiordesignbyneha — Implementation Plan

> Status: **Approved 14 Oct 2026 (Phase 1 complete).** Committed as `docs/implementation-plan.md` on branch `claude/new-session-pr49mb` of `Neerajmaurya27/docs`; to be copied into the new site repository as its first commit.
> Prepared 14 Oct 2026. Every studio fact not found in the repository is marked **[VERIFY]**, and Neha/studio owns each one (register in §7).

## Context

The brief asks for a production website for interiordesignbyneha, a premium interior studio working in Mumbai and Dubai. It should read as a "quiet monograph": photography-led, editorial and fast, with an enquiry flow that qualifies leads. This session only inspects the repo and plans. The inspection shows that the repository holds no studio code or content at all. It is an unrelated snapshot of GitHub's documentation site. So the plan uses the **default stack** (Astro 7 static + Tailwind v4 + Cloudflare). On your instruction it builds in a **new dedicated repository**, and this repo stays untouched apart from the plan file.

---

## 1. Repository findings (`Neerajmaurya27/docs`, branch `claude/new-session-pr49mb`)

| # | Item | Finding (with paths) |
|---|------|---------|
| 1 | Framework / runtime | This is **GitHub Docs (docs.github.com) as of 27 Nov 2020**, last commit `42516b96 "repo sync"` by Octomerger Bot, with 1,392 commits. It's an Express 4 server (`server.js`, `middleware/*.js`) rendering Liquid templates (`layouts/*.html`, `includes/`), with a webpack 4 bundle (`webpack.config.js`, `javascripts/*.js`) and Sass with Primer CSS 15 (`stylesheets/*.scss`). The Node pin is `14.13.0` (`.node-version`) and `engines: "12 - 14"` (`package.json`). Both versions are end-of-life. npm with `package-lock.json` (863 KB). Heroku deploy (`Procfile`, `app.json`). Not Next.js and not Astro. The container has Node v22.22.0 / npm 10.9.4. |
| 2 | Scripts | `start`/`dev` (nodemon server.js), `build` (webpack), `lint` (**runs `eslint --fix` and `prettier -w`, which modify files**), `test` (jest + eslint + prettier + check-deps), `browser-test` (puppeteer), `pa11y-ci`, Algolia `sync-search*`. **Not run.** `node_modules` is absent, running anything would need `npm install` (which the brief forbids), and `lint` writes files. The Node 12–14 engines are also incompatible with the container's Node 22. |
| 3 | Dependencies | **None are useful for this site.** Outdated or risky: webpack 4, babel-loader 8, sass-loader 9, helmet 3, `csurf` (deprecated/archived), express-rate-limit 5, puppeteer 2, jest 26, eslint 7, algoliasearch 3, got 9, node-fetch 2, js-yaml 3, semver 5. No smooth-scroll or animation libraries are present. **The Next.js 14 Oct 2026 security update does not apply** (no Next.js). |
| 4 | Routes / layouts / components | Routes come from Markdown under `content/` (GitHub product docs) and `translations/` (7 locales). Layouts: `layouts/default.html`, `product-landing.html`, `release-notes.html`, `dev-toc.html`, `error-404.html`, `error-500.html`. **None map to the target sitemap** (/, /projects, /approach, /studio, /enquire, /privacy, /404). |
| 5 | Styling / fonts | Sass + `@primer/css` 15 (`stylesheets/index.scss` and 17 partials). There are no design tokens matching the brief. Fonts: `assets/fonts/alliance/*.woff` (4 files, **Alliance No. 1, GitHub's commercially licensed font, which must not be reused**). |
| 6 | Content / data | `content/` (9.2 MB of GitHub docs), `data/` (reusables, variables, GraphQL/REST schemas), `translations/` (117 MB). **There is no studio content.** A keyword search for "neha", "mumbai", "dubai", "whatsapp" and "interior design" found only false positives in a GitHub SARIF article. |
| 7 | Assets | `assets/` is 123 MB: 2,379 PNG, 25 GIF, 2 JPG, 7 SVG, 4 PDF and 1 ICO, all GitHub UI screenshots. The favicons/logos (`assets/images/site/favicon.*`, `logo.png`, `invertocat.png`) are **GitHub trademarks**. **There are no studio photographs, wordmark or logo.** Nothing AI-generated is posing as project work, because no project imagery exists. |
| 8 | Integrations | Algolia search, Heroku, Fastly cache headers (`middleware/set-fastly-cache-headers.js`), CSRF, Redis rate limit, Crowdin (`crowdin.yml`), and 35 GitHub-specific Actions workflows in `.github/workflows/` (repo-sync, Algolia, Crowdin, triage…). Several of these would fail or misfire on a fork. No forms, email, WhatsApp, maps, CMS, Cloudflare/Vercel/Netlify config or analytics of the kind needed. |
| 9 | Tests / quality | Jest 26 (`tests/`, `jest.config.js`), jest-puppeteer, pa11y-ci (`.pa11yci`), linkinator, ESLint 7 standard config (`.eslintrc.js`), Prettier (`.prettierrc.json`). None of it is reusable as-is. |
| 10 | A11y / perf in code | Not relevant: no target pages exist. (For the record, the old JS uses scroll/DOM-mutation patterns, and the CSS relies on Primer utility classes. None of it carries over.) |
| 11 | Preserve / adapt / replace | See §3. In short, **replace everything**. Nothing is carried into the new repo. |
| 12 | Missing inputs | All of them: brand, photography, facts, accounts. See §7. |

**Verdict:** the repository can't be used for this project. On your instruction, the build happens in a **new private repository** (proposed name `interiordesignbyneha-web` [VERIFY name/owner]). This repository is left as-is apart from `docs/implementation-plan.md`. Creating the new repo is an outward-facing step and needs your go-ahead at the start of Phase 2.

## 2. Stack decision

**Default stack** (repo unusable):

- **Astro 7.x** (latest stable at scaffold time), `output: 'static'`, one on-demand route (`prerender = false`) via `@astrojs/cloudflare`. TypeScript using `astro/tsconfigs/strictest`.
- **Tailwind CSS v4** via `@tailwindcss/vite`, with tokens in CSS `@theme` and no `tailwind.config.js`.
- **Content collections** with Zod (`src/content.config.ts`), glob loader and the `image()` helper. Images are co-located per project.
- **Images:** `astro:assets` `<Picture>`/`getImage` with Sharp at build time, producing AVIF + WebP + JPEG.
- **Motion:** no library. CSS transitions, a ~1 KB IntersectionObserver reveal script, native `position: sticky`, and CSS `@view-transition { navigation: auto }` behind `prefers-reduced-motion: no-preference`. Astro's `<ClientRouter>` is **not** used, so the site stays at zero framework JS.
- **Hosting:** Cloudflare Workers static assets, with the SSR endpoint through the Cloudflare adapter. Previews come from `wrangler versions upload` per PR. Not Vercel Hobby.
- **Node 22 LTS** (`.nvmrc` = `22`), pnpm (lockfile committed). npm also works, but pnpm is faster in CI.
- **Why:** the site is mostly static and image-heavy. This stack ships zero framework JS by default, has a built-in image pipeline, typed and validated content, native view transitions, cheap global hosting with free static traffic, and HTML-first files that are easy to review.

**Libraries to add, each with a reason:**

| Package | Why |
|---|---|
| `astro`, `@astrojs/cloudflare`, `@astrojs/sitemap`, `@astrojs/check`, `typescript` | Core framework, adapter, sitemap.xml, type check. |
| `tailwindcss`, `@tailwindcss/vite` | Tokens and utilities (v4 CSS-first). |
| `sharp` | Build-time image encoding. |
| `@fontsource-variable/fraunces`, `@fontsource-variable/inter` (or the Astro Fonts API if stable in 7.x) | Self-hosted OFL WOFF2, subset to Latin. Fallbacks are metric-matched via the Fonts API `fallbacks`, or `fontaine` if not. |
| `zod` (via `astro/zod`) | One schema shared by the client form and the server endpoint. |
| `jose` | Signs a Google service-account JWT with WebCrypto in Workers, so Sheets appends need no `googleapis`, which is heavy and Node-only. Only needed if Sheets is chosen. |
| `resend` (or plain `fetch` to its REST API) | Transactional email [VERIFY account]. Plain `fetch` is preferred to keep the Worker small. |
| Dev: `eslint` 9 flat config + `eslint-plugin-astro` + `eslint-plugin-jsx-a11y`, `prettier` + `prettier-plugin-astro`, `@playwright/test`, `@axe-core/playwright`, `@lhci/cli`, `vitest`, `wrangler` | Quality gates per §9. **Vitest is an addition to the brief:** it unit-tests the enquiry schema, the WhatsApp URL builder and the token contrast table, which are pure functions and quicker to test there than with Playwright. lychee runs as a GitHub Action binary, not an npm dependency. |

**Explicitly not added:** GSAP, Motion, Lenis, Locomotive, AOS, swiper or carousel libraries, React or any UI framework island, or a CMS (only add Keystatic if non-developers must edit weekly).

## 3. Preserve / adapt / replace

| Item in this repo | Decision | Reason |
|---|---|---|
| Express/Liquid/webpack app, `middleware/`, `lib/`, `javascripts/`, `layouts/`, `includes/` | Replace (not carried over) | Unrelated product and EOL toolchain. |
| `content/`, `data/`, `translations/`, `assets/` | Replace | GitHub's content and trademarks, under CC-BY/MIT licences, and unrelated. |
| `assets/fonts/alliance/*` | **Must not reuse** | Proprietary licence. |
| `.github/workflows/*` (35) | Replace | GitHub-internal automation. The new repo gets a single `ci.yml` + `deploy.yml`. |
| `.editorconfig`, `.prettierrc.json` conventions | Adapt (idea only) | We'll recreate an equivalent 2-space/LF config. |
| pa11y/linkinator approach | Adapt (idea only) | Replaced by axe-core/playwright and lychee. |
| This repo itself | Preserve, untouched | It only gains `docs/implementation-plan.md`. The existing `docs/index.yaml` is left alone. |

## 4. Target architecture (new repo)

```
/
├─ astro.config.mjs        # site URL, static output, cloudflare adapter, sitemap, image config, vite tailwind
├─ wrangler.jsonc          # Workers static assets + SSR entry, routes, env bindings
├─ .nvmrc  .env.example  tsconfig.json  eslint.config.js  .prettierrc  lighthouserc.json  playwright.config.ts  vitest.config.ts
├─ public/  fonts/(if not via Fonts API)  favicon.svg  apple-touch-icon.png  robots.txt(generated)  og/default.jpg
├─ src/
│  ├─ content.config.ts    # collections: projects, press, testimonials, team, faq, processSteps, pages(home/approach/studio copy)
│  ├─ content/
│  │  ├─ projects/<slug>/index.md + images/<slug>-<nn>-<room>-<orientation>.jpg + plan.svg
│  │  ├─ press/*.yaml  team/*.md  faq/*.yaml  process/*.yaml  testimonials/*.yaml
│  │  └─ home.yaml  approach.md  studio.md  privacy.md  thank-you.md
│  ├─ data/site.ts         # studio name, offices[], socials, replyPromise, sizeThreshold, budget/size bands, servicesByCity
│  ├─ lib/ enquiry-schema.ts  whatsapp.ts  verify.ts (dev badge / prod guard)  seo.ts  jsonld.ts  analytics.ts  sheets.ts  email.ts  turnstile.ts
│  ├─ styles/ tokens.css (@theme)  global.css  motion.css  fonts.css
│  ├─ scripts/ reveal.ts  sticky-caption.ts  header.ts  mobile-menu.ts  enquiry-bar.ts  project-filters.ts  lightbox.ts  before-after.ts  enquiry-form.ts  analytics.ts
│  ├─ layouts/ BaseLayout.astro  ProjectLayout.astro
│  ├─ components/
│  │  ├─ ui/ Button  TextLink  ChapterLabel  Picture (art-directed)  Hairline  ChoiceCard  Field  ErrorSummary  DevVerifyBadge
│  │  ├─ site/ SkipLink  SiteHeader  MobileMenu  SiteFooter  StickyEnquiryBar  Seo  JsonLd  Breadcrumb  WhatsAppLink
│  │  ├─ home/ Hero  SelectedWork (+ SpreadA/B/C)  DesignInDetail (StickyCaptionSequence)  PointOfView  ProcessSteps  Credibility  EnquiryBand
│  │  ├─ projects/ ProjectCard  ProjectGrid  ProjectFilters  ProjectHero  FactsPanel  ImageSequence (full|pair|pair-offset|trio|spread)
│  │  │             CraftSequence  MadeForThisHome  FloorPlan  BeforeAfter  Film  Testimonial  Credits  ProjectEnquiry  RelatedProjects  Lightbox
│  │  └─ enquire/ EnquiryForm  ContactPanel
│  └─ pages/ index  projects/index  projects/[slug]  approach  studio  enquire  enquire/thank-you  privacy  404
│           api/enquiry.ts (prerender=false)  dev/tokens.astro (excluded from prod build)
├─ scripts/ check-placeholders.mjs  image-audit.mjs  asset-inventory.mjs
└─ tests/ e2e/*.spec.ts  a11y.spec.ts  visual.spec.ts  unit/*.test.ts
```

- **Routing for later additions:** `/journal`, `/press`, `/hospitality` and `/ar/` are reserved. CSS uses logical properties (`margin-inline`, `inset-inline-start`) everywhere from day one, `<html lang dir>` comes from the layout, and `Seo.astro` accepts `alternates[]` for hreflang.
- **Server endpoint `src/pages/api/enquiry.ts`:** POST only. Steps: honeypot check, then time-to-submit check (≥4 s), then Turnstile siteverify, then Zod parse with the shared schema, then Resend (email to the studio + plain confirmation to the enquirer), then Sheets/CRM append, then a 303 redirect to `/enquire/thank-you`. With JS on, it responds with JSON. On failure it re-renders or returns field errors, and typed data is never lost.
- **Environment variables (`.env.example`):** `PUBLIC_SITE_URL`, `PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`, `RESEND_API_KEY`, `ENQUIRY_TO_EMAIL`, `ENQUIRY_FROM_EMAIL`, `LEAD_STORE` (`sheets`|`crm`|`none`), `GOOGLE_SHEETS_ID`, `GOOGLE_SA_EMAIL`, `GOOGLE_SA_PRIVATE_KEY`, `CRM_WEBHOOK_URL`, `PUBLIC_ANALYTICS_PROVIDER`, `PUBLIC_ANALYTICS_DOMAIN`, `PRIVACY_NOTICE_VERSION`. Secrets are set with `wrangler secret put`, and their GitHub Actions copies live as environment secrets.

## 5. Tokens as implemented

- `src/styles/tokens.css`: a Tailwind v4 `@theme` holds the brief §4 colours verbatim (`--color-limewash` … `--color-brass`), the fonts (`--font-display: "Fraunces Variable", <metric fallback>, serif`; `--font-sans: "Inter Variable", <metric fallback>, sans-serif`), and the fluid type scale (`--text-display: clamp(2.25rem, …, 5rem)` etc. as in brief §4, with line-heights as `--text-*--line-height`). It also defines the spacing scale (4…160), the breakpoints (`--breakpoint-tablet: 600px`, `--breakpoint-nav: 900px`, `--breakpoint-desktop: 1024px`, `--breakpoint-wide: 1440px`), the widths (`--width-text: 36rem`, `--width-wide-text: 48rem`, `--width-cap: 1440px`), and `--radius-button: 2px`. **Tailwind's default colour palette is reset** (`--color-*: initial;`), so only brand colours exist. That is how "no hard-coded colours" is enforced.
- `src/styles/global.css`: a 4/8/12-column grid utility (`.grid-page`) with gutters and margins per breakpoint, `:focus-visible` rings (2px terracotta, 2px offset; `.on-espresso` switches to sand), `scroll-padding-top` = header height (WCAG 2.4.11), `svh` units, and `overflow: clip` (never `hidden`) on wrappers above sticky elements.
- `src/styles/motion.css`: the brief §6 tokens verbatim (`--dur-micro` … `--ease-exit`, `--reveal-distance: 24px`, `--image-scale-max: 1.03`). `.js-reveal [data-reveal]` holds the initial hidden state, so content stays visible without JS. `@media (prefers-reduced-motion: reduce)` zeroes transforms and limits opacity transitions to ≤200 ms. The `@view-transition` and `::view-transition-*` timings (old 150 ms out; new 300 ms in after a 100 ms delay) sit inside `(prefers-reduced-motion: no-preference)`. Every effect has a `/* purpose: orientation|continuity|emphasis */` comment.
- **Contrast:** `tests/unit/contrast.test.ts` asserts every pair listed in the brief (e.g. taupe/stone ≥4.5, terracotta never on espresso), so a token edit can't silently fail AA.
- `/dev/tokens` renders swatches, type and spacing in dev only. It's excluded via `import.meta.env.DEV` + `getStaticPaths` returning nothing in production.

## 6. Page specs → components

- **Header** (`SiteHeader`, `header.ts`): 72/56 px. Transparent over the hero, then solid limewash + hairline once a **sentinel element 80 px down leaves the viewport (IntersectionObserver, not a scroll listener)**. **Hide-on-scroll-down is dropped at launch**: it can't be built without a scroll handler, which the brief bans (see Q7). Desktop nav from 900 px: wordmark · Projects · Approach · Studio · [Discuss your project] (secondary button). Mobile: wordmark · WhatsApp icon button (`aria-label="WhatsApp the studio"`) · "Menu".
- **Mobile menu** (`MobileMenu`, `mobile-menu.ts`): a `<dialog>` shown modally, so focus is trapped natively and Escape closes it. Focus returns to the trigger. It holds links, Mumbai/Dubai contacts and the enquiry button. Without JS, "Menu" is an anchor link to the footer nav.
- **Home** (`pages/index.astro`, copy in `content/home.yaml`): seven chapters exactly as brief §7.
  - 01 `Hero` (`<picture>` with desktop 3:2/16:9 and mobile 4:5 sources, `fetchpriority="high"`, eager, an espresso gradient overlay, no animation).
  - 02 `SelectedWork` (featured projects by `homeOrder`, spreads A/B/C, facts always visible, `view-transition-name: project-<slug>`).
  - 03 `DesignInDetail` (stone band; `StickyCaptionSequence` on desktop, stacked on mobile; captions live in the DOM).
  - 04 `PointOfView`.
  - 05 `ProcessSteps` (from `process` collection; the per-city delivery line comes from `site.ts`).
  - 06 `Credibility` renders **only if** at least one verified press/testimonial entry exists. Otherwise it outputs nothing.
  - 07 `EnquiryBand` (espresso; paper-outline button; WhatsApp Mumbai/Dubai links).
  - Then `SiteFooter` and `StickyEnquiryBar` (below 600 px; shows after the hero sentinel leaves view; hidden while the menu/lightbox is open or while chapter 07 or a form is intersecting; body gets `padding-bottom: 52px + safe-area`).
- **/projects** (`ProjectGrid`, `ProjectFilters`, `project-filters.ts`): the full list is in the HTML, in `indexOrder`. Rows follow the pattern full landscape → two portraits → three 4:5. Filters are `<a href="?type=…&city=…">` links, so they work without JS (which shows all projects). With JS they filter in place, use `history.replaceState`, update an `aria-live` count, and restore from the URL on load and back. A chip is hidden unless its option has ≥3 projects.
- **/projects/[slug]** (`ProjectLayout`): the 13 blocks + optional film from brief §9, each optional block wrapped in `{data && <Block/>}`, so missing blocks leave no gaps. `FactsPanel` is sticky on desktop and a `<details>` on mobile. `Lightbox` is a `<dialog>` with buttons, arrow keys, Escape and swipe; it pushes a history state so the back gesture closes it, and it returns focus. `BeforeAfter` uses a range input + buttons (no drag-only). `FloorPlan` is an inline SVG with a `<desc>` and a notes list. `ProjectEnquiry` links to `/enquire?type=&city=&project=` and a WhatsApp prefill with the project title. `RelatedProjects` picks two (same city or type, falling back to `related[]`) plus the next project in `indexOrder`.
- **/approach:** philosophy (`content/approach.md`), a **services table per city driven by `site.ts.servicesByCity` [VERIFY]**, the 5-step process, and an FAQ (fees approach, timelines, working between cities, Vastu on request, what we don't do) as `<details>`.
- **/studio:** Neha, team (`team` collection), **only real addresses**, craft partners, and press & recognition (verified only).
- **/enquire** (`EnquiryForm`, `enquiry-form.ts`, no animation): fields 1–12 + hidden fields per brief §12, built from `ChoiceCard`/`Field`. Budget bands switch INR/AED with the location choice (server-rendered as two fieldsets, with JS toggling which is shown; without JS both show). Service options are filtered by `servicesByCity`. The form prefills from the query. There's an error summary with focus moved to it, and `aria-describedby` on fields. The default phone country follows the city. `ContactPanel` sits beside it with WhatsApp ×2, phone, studio email and the reply promise.
- **/enquire/thank-you:** what happens next, timing and a WhatsApp link (`content/thank-you.md` [VERIFY]). `noindex`.
- **/privacy:** plain-language notice covering India DPDP, UAE PDPL and EU visitors, plus processors (Cloudflare, Resend, Google/CRM, Meta for WhatsApp, the analytics provider). It carries a version string that matches `PRIVACY_NOTICE_VERSION`. An Arabic version is recommended [VERIFY with counsel].
- **/404:** links to Projects and Enquire.

## 7. Assets and the [VERIFY] register

**Asset inventory:** **nothing exists yet.** `scripts/asset-inventory.mjs` will generate this table from `src/content/projects/*` and fail on gaps. Template:

| Project | Hero desktop 3:2/16:9 | Hero mobile 4:5 | Sequence 8–15 | Details 3–6 | Plan SVG | Before/after | Site photos | Photographer credit | Facts verified |
|---|---|---|---|---|---|---|---|---|---|
| (6–10 projects, ≥1 Dubai) [VERIFY] | missing | missing | missing | missing | optional | optional | optional | missing | no |

Masters are 2560–3200 px sRGB, named `<slug>-<nn>-<room>-<orientation>.jpg`. Raw originals stay outside the repo; use Git LFS if the repo exceeds ~1 GB.

**Register.** The owner of every item is **Neha/studio** unless stated. Default handling until verified: the element is hidden, or the build fails if it is a required item.

| # | Item | Default until verified |
|---|---|---|
| V1 | Neha's surname, credentials, institution, founding year | Credential line hidden; portrait chapter shows statement only |
| V2 | Neha's statement (70–100 words) in her own words | Chapter 04 hidden |
| V3 | Scope per city: execution/fit-out in Mumbai? Dubai licence (design consultancy vs fit-out) | Hero/H1 says "designed and detailed"; no execution claim; delivery line hidden |
| V4 | Services actually offered per city (enquiry options + /approach table) | Only "Design only" + "Not sure yet" shown |
| V5 | Hero photo + caption (project, area, year) | Required; build fails without it |
| V6 | 6–10 real completed projects: facts (area, type, sq ft, year, status), credits, photographer, permission to publish, client anonymity | Unverified projects not published |
| V7 | Any Dubai project | Home ch.02 shows Mumbai only; no Dubai claim |
| V8 | Craft captions / workshop names (e.g. "Statuario", "fluted teak by [workshop]") | Caption reduced to material only, or item hidden |
| V9 | Hand-off line "Every one of these homes was decided in the details." | Omitted |
| V10 | Press/awards (publication, title, year, URL) | Chapter 06 and Studio press section hidden |
| V11 | Testimonials with written permission (permissionRef) | Hidden |
| V12 | Size threshold (~3,000 sq ft?) | Sentence removed |
| V13 | Three suitability facts for chapter 07 | Omitted |
| V14 | Reply promise ("within one working day", who replies) | Generic "We reply to every enquiry personally." [still VERIFY] |
| V15 | Size bands and INR/AED budget bands | Size/budget questions hidden |
| V16 | Office addresses, premises, trade licence / registration numbers per city | Footer: "Mumbai · Dubai — by appointment"; no LocalBusiness address in JSON-LD |
| V17 | Phone + WhatsApp numbers, Mumbai (+91) and Dubai (+971) | All WhatsApp/phone links omitted (never fake numbers); build warns |
| V18 | Studio-domain email + domain name (DNS access) | Required for launch |
| V19 | Instagram and other social URLs | Omitted |
| V20 | Wordmark/logo (SVG), favicon | Text wordmark in Fraunces until supplied |
| V21 | Team members, roles, bios, portraits (with consent) | Team section hidden |
| V22 | Process steps wording + 5 process photos | Text-only steps |
| V23 | FAQ answers (fees approach, timelines, Vastu, what we don't do) | FAQ items without answers hidden |
| V24 | Craft partners list (with consent to be named) | Hidden |
| V25 | Accounts: Cloudflare, domain registrar, Resend (+ DNS SPF/DKIM), Turnstile, lead store (Sheets vs CRM), analytics provider | Blocks Phase 7/9 |
| V26 | Privacy notice review by counsel (DPDP, PDPL, EU); Arabic version | Draft notice marked for review; launch gated |
| V27 | Canela licence | Not used; Fraunces only |
| V28 | Photography credits and usage licences for web | Required per project |
| V29 | Whether any images are renders | Must be labelled "Concept visualisation" |
| V30 | Old site URLs (for redirects) | None assumed |

**Mechanism** (`src/lib/verify.ts` + build guard):
- Content fields can hold `[VERIFY …]` strings. In dev, `DevVerifyBadge` shows them in a visible style.
- `content.config.ts` uses `superRefine`: when `import.meta.env.PROD` is true and `published: true`, it rejects `verified.facts === false`. **`published: boolean` is an addition to the brief's model**, so drafts can live in the repo.
- `scripts/check-placeholders.mjs` scans `dist/` for `[VERIFY`, `lorem`, `TODO` and `placeholder` (case-insensitive, excluding HTML `placeholder=` attributes) and exits non-zero.

## 8. Phases

Estimates are developer-days for one experienced developer. Studio inputs gate where noted.

| Phase | Goal & key files | Depends on | Risks | Acceptance | Effort |
|---|---|---|---|---|---|
| **1 Audit & strategy** | This plan → `docs/implementation-plan.md` (this repo) | — | — | Approved by you | done |
| **2 Foundations** | Create the new repo (your go-ahead) and scaffold Astro 7 + strictest TS + Tailwind v4 + ESLint/Prettier + CI skeleton. Files: `src/styles/{tokens,global,motion,fonts}.css`, fonts, `components/ui/{Button,TextLink,ChapterLabel,Picture,ChoiceCard,Field}.astro`, `pages/dev/tokens.astro`, `tests/unit/contrast.test.ts` | Repo creation; V27 | Fonts API maturity in 7.x; v4 + Astro version fit | Tokens render on /dev/tokens; contrast tests pass; ≤5 font files, display font preloaded; CLS from font swap ≈0 | 3 |
| **3 Shared structure** | `layouts/BaseLayout.astro`, `site/{SkipLink,SiteHeader,MobileMenu,SiteFooter,StickyEnquiryBar,Seo,JsonLd,Breadcrumb,WhatsAppLink}.astro`, `pages/404.astro`, `data/site.ts`, `lib/whatsapp.ts` (+unit tests), `scripts/{header,mobile-menu,enquiry-bar}.ts` | 2; V16–V20 (degrade per register) | Focus obscured by sticky header/bar; `<dialog>` quirks on iOS | Keyboard-only walkthrough passes; focus never obscured (scroll-padding verified by e2e); all nav links resolve | 3 |
| **4 Homepage** | `pages/index.astro`, `content/home.yaml`, `home/*` components, `scripts/{reveal,sticky-caption}.ts` | 3, 5's content schema; **photos V5–V8** | Hero gradient contrast against real image; sticky broken by overflow | Chapter order and heights per brief; hero is LCP, ≤2.5 s Lighthouse mobile; reduced-motion = static; full content with JS disabled; ch.06 absent when empty with no gap | 4 |
| **5 Projects** | `content.config.ts`, `content/projects/*`, `pages/projects/{index,[slug]}.astro`, `layouts/ProjectLayout.astro`, `projects/*` components, `scripts/{project-filters,lightbox,before-after}.ts`, `scripts/asset-inventory.mjs` | 2–3; **V6, V28, V29** | Inconsistent photography; view-transition names clashing | Two structurally different real projects render (with/without plan/film/testimonial); optional blocks leave no gaps; filters work without JS and survive back button; lightbox fully keyboard-operable | 6 |
| **6 Approach & Studio** | `pages/{approach,studio}.astro`, `content/{approach.md,studio.md,faq/,team/,press/,process/}` | **V1–V4, V10, V21–V24** | Unverified claims creeping in | Only verified claims; services table equals `servicesByCity`; placeholder guard green | 2 |
| **7 Enquiry** | `pages/enquire.astro`, `pages/enquire/thank-you.astro`, `enquire/{EnquiryForm,ContactPanel}.astro`, `scripts/enquiry-form.ts`, `lib/{enquiry-schema,turnstile,email,sheets}.ts`, `pages/api/enquiry.ts`, `pages/privacy.astro`, `.env.example`, `wrangler.jsonc` | **V14, V15, V17, V18, V25, V26** | Spam; Workers runtime limits (no Node `googleapis`); email deliverability (SPF/DKIM/DMARC) | Real test submission reaches studio inbox + sheet/CRM + enquirer confirmation; honeypot, too-fast and bad-Turnstile requests rejected (e2e + unit); consent timestamp and notice version stored; WhatsApp hrefs match config and are URL-encoded; works without JS (POST + 303) | 4 |
| **8 Responsive & motion** | Crops/focal points, desktop-only sticky, view transitions, mobile bar tuning | 4–7 + all crops | iOS Safari viewport units; Firefox lacks cross-doc VT (must degrade) | Screenshots at 360/390/768/1024/1440/1920 approved; real iPhone Safari + mid-range Android tested at 4× CPU throttle; no horizontal scroll; `svh` only | 3 |
| **9 A11y/perf/SEO/tests** | `tests/e2e/*.spec.ts`, `tests/a11y.spec.ts`, `tests/visual.spec.ts`, `lighthouserc.json`, `.github/workflows/{ci,deploy}.yml`, `scripts/{check-placeholders,image-audit}.mjs`, sitemap/robots, JSON-LD | 2–8; V25 analytics | Flaky visual tests (fonts) | All CI checks green; axe zero violations on every route; budgets met; manual VoiceOver iOS + NVDA pass; Rich Results test passes | 4 |
| **10 QA & launch** | Spec review, fact check, redirects (`public/_redirects` or Worker rules), analytics check, DNS, Google Business Profile per real office (studio task) | All; V26, V30 | Late content changes | Zero `[VERIFY]` in prod build; studio sign-off; production smoke test (all routes 200, test enquiry delivered) | 2 |

**Total ≈ 31 dev-days**, excluding content, photography and counsel time.
- **Gates:** content/photography (studio) gates phases 4–6 and 10. Accounts gate 7 and 9. Tokens gate everything visual.
- **Order of work:** phases 4–6 can run on fixture content (clearly marked `published: false`) until real material arrives. Fixture images will be flat stone-coloured placeholders, **never stock or AI photos**.

**Key risks:**
- Missing or inconsistent photography. The largest schedule risk.
- Overclaiming execution in Dubai (V3).
- Firefox lacking cross-document view transitions, and scroll-driven animations not used at all. Everything degrades to plain navigation.
- `svh`/`dvh` behaviour on iOS.
- Sticky positioning broken by `overflow: hidden`. Mitigation: `overflow: clip` + a lint/review rule.
- Spam. Mitigation: Turnstile, honeypot and a timing check.
- DPDP obligations (from 13 May 2027) and PDPL (executive-regulation status unclear): needs counsel.
- Scope creep into a CMS.

## 9. Testing, CI and deployment

**Testing:**
- **Static checks:** `astro check`, `tsc --noEmit`, `eslint .` and `prettier --check` on every PR.
- **Unit (Vitest):** enquiry schema, WhatsApp builder (format `https://wa.me/<digits>?text=<encoded>` with no `+`, spaces or leading zero; recheck WhatsApp's help page before launch), contrast table, related-project selection.
- **Playwright e2e** against `astro preview`, with a mocked `/api/enquiry` in e2e and the real endpoint in a staging smoke test:
  - every route returns 200 and has exactly one H1
  - nav links work
  - mobile menu opens and closes, with focus trap and focus return
  - filters, back button and the no-JS project list
  - two case-study variants
  - lightbox keyboard control and back gesture
  - form validation, prefill, success and error-with-data-preserved
  - WhatsApp hrefs
  - no console errors or warnings
  - the sticky bar never covers a focused element
  - JS-disabled project (content visible)
- **axe:** `@axe-core/playwright` on every route with `wcag2a, wcag2aa, wcag21aa, wcag22aa`, requiring zero violations. Also a reduced-motion emulation that asserts the computed `transform` is `none` on revealed items.
- **Visual:** `toHaveScreenshot` at 390×844, 768×1024 and 1440×900 for home, projects, one case study and enquire. Animations are disabled, fonts are loaded before capture, and baselines are generated in the CI Linux container.
- **Lighthouse CI** (`lighthouserc.json`): home, projects, a case study and enquire on mobile.
  - Scores and timings: perf ≥0.9, LCP ≤2500 ms, CLS ≤0.1, TBT ≤200 ms.
  - Resource budgets: JS ≤30 KB gz, CSS ≤40 KB gz, first-screen ≤500 KB, case study ≤2 MB excluding lazy images.
- **Build scripts and link checks:**
  - `scripts/image-audit.mjs` checks that every `<img>` has width, height and alt, and that the hero has `fetchpriority=high` and isn't lazy.
  - `scripts/check-placeholders.mjs` is the placeholder guard from §7.
  - `lychee` runs on `dist/` for internal and external links.

**Global acceptance criteria → checks:**

| Criterion | Check |
|---|---|
| Routes and custom 404 | e2e (all routes 200, 404 page) + lychee |
| Header, menu, CTAs, WhatsApp/phone/email links | e2e + lychee + WhatsApp unit test |
| Case-study variants | e2e (two variants) + visual screenshots |
| Tokens used consistently | Tailwind palette reset + ESLint/stylelint rule against hex/px literals outside `tokens.css` + review |
| Responsive, no horizontal scroll | Playwright test at each width asserting `scrollWidth <= clientWidth` |
| Works without JS and with reduced motion | JS-disabled e2e + reduced-motion e2e |
| Keyboard and screen reader | axe + keyboard e2e + manual screen-reader pass |
| Images | image-audit + Lighthouse |
| Build and quality gates | CI |
| No placeholders, no console noise | placeholder guard + console-error e2e |

**CI and deploy:**
- **CI (`.github/workflows/ci.yml`):** install (pnpm, cache), then lint/typecheck/unit, then build (prod mode, so the placeholder guard and the verified-facts guard run), then e2e/a11y/visual (Playwright using the preinstalled Chromium in CI images, plus WebKit for iOS-like coverage), then Lighthouse CI, then lychee.
- **Deploy (`.github/workflows/deploy.yml`):**
  - Every PR runs `wrangler versions upload`, which gives a preview URL commented on the PR, and preview pages carry `noindex`.
  - Each push to `main` runs `wrangler deploy` to production.
  - Secrets live in GitHub environment secrets (`CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`) and as Worker secrets.
  - Staging uses Turnstile test keys and a test sheet.
- **Domains:** the apex `interiordesignbyneha.<tld>` [VERIFY domain] plus `www` → apex redirect, HSTS, and Resend DNS records (SPF, DKIM, DMARC).
- **Redirects:** `public/_redirects` for any old URLs (V30).

## 10. Open questions and assumptions (with proposed defaults)

1. **New repo name/visibility/owner:** default `Neerajmaurya27/interiordesignbyneha-web`, private. Needs your confirmation before creation.
2. **Domain and DNS access:** assumed to be obtainable [V18].
3. **Lead store:** default Google Sheets via service account, chosen because it has zero cost and the studio can read it. Switch to a CRM webhook if preferred.
4. **Analytics:** default **Cloudflare Web Analytics**, which is cookieless, free and already on the host. Custom events (§14 of the brief) need Plausible or Umami, because CF Web Analytics has no custom events. **Recommendation: Plausible** if the event list matters [V25].
5. **Package manager:** pnpm. Node 22 LTS.
6. **Fonts:** Fraunces + Inter variable, Latin subset. Self-hosted through the Astro Fonts API if it's stable in 7.x, otherwise Fontsource + fontaine.
7. **Header hide-on-scroll:** omitted at launch (it would need a scroll handler). Solid-on-scroll uses an IntersectionObserver sentinel.
8. **Filters on /projects:** with JS, query-string filtering. Without JS, all projects are shown and the filter links reload with the query (the page stays static, so the query is applied by JS only).
9. **Enquiry without JS:** a plain form POST to the endpoint, which redirects on success or returns an SSR error page that echoes the input back. Turnstile still needs JS, so no-JS submissions get a "please enable JS or WhatsApp/email us" fallback on rejection.
10. **Arabic /ar/:** routes and `dir`/`hreflang` plumbing are prepared, with no translated pages at launch.
11. **Content editing:** Markdown/YAML in git, with developer-assisted updates. Revisit Keystatic only if the studio edits weekly.
12. **Plan location:** committed to this repo as `docs/implementation-plan.md` (per the brief) and duplicated into the new repo.

---

**After approval:**
1. Write this file to `docs/implementation-plan.md` in `Neerajmaurya27/docs`, then commit and push to `claude/new-session-pr49mb`.
2. Ask for confirmation of the repo name/visibility, then create the new repository and begin Phase 2.

No application code is written before then.
