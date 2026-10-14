/**
 * Content collections (plan §10). Projects live in src/content/projects/<slug>/index.md with
 * their images alongside. Development-only fixtures live in src/fixtures/projects and are
 * never read by production builds (see src/lib/projects.ts).
 */
import { defineCollection, type SchemaContext } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

/** See src/lib/preview.ts: fixtures load in `astro dev` and in preview builds only. */
const SHOW_FIXTURES = import.meta.env.DEV || import.meta.env.PUBLIC_SHOW_FIXTURES === 'true';

export const PROJECT_TYPES = [
  'residence',
  'villa',
  'penthouse',
  'hospitality',
  'commercial',
] as const;
export const REGIONS = ['mumbai', 'dubai', 'other'] as const;
export const SEQUENCE_LAYOUTS = ['full', 'pair', 'pair-offset', 'trio', 'spread'] as const;
const IMAGES_PER_LAYOUT: Record<(typeof SEQUENCE_LAYOUTS)[number], number> = {
  full: 1,
  pair: 2,
  'pair-offset': 2,
  trio: 3,
  spread: 1,
};

const focal = z
  .string()
  .regex(/^\d{1,3}% \d{1,3}%$/, 'Focal point must look like "50% 40%"')
  .optional();

const projectSchema = ({ image }: SchemaContext) => {
  const picture = z.object({
    src: image(),
    alt: z.string().min(1),
    caption: z.string().optional(),
    orientation: z.enum(['landscape', 'portrait', 'square']),
    focal,
  });

  return z.object({
    title: z.string().min(1),
    codeName: z.string().optional(),
    /** Neighbourhood or locality, e.g. "Worli". */
    locality: z.string().optional(),
    city: z.string().min(1),
    country: z.string().min(1),
    region: z.enum(REGIONS),
    type: z.enum(PROJECT_TYPES),
    areaSqft: z.number().int().positive().optional(),
    areaSqm: z.number().int().positive().optional(),
    year: z.number().int().min(1990).max(2100),
    status: z.enum(['completed', 'in-progress']),
    services: z.array(z.string()).default([]),
    teamLead: z.string().optional(),
    architect: z.string().optional(),
    contractor: z.string().optional(),
    craftPartners: z
      .array(z.object({ name: z.string(), craft: z.string(), city: z.string() }))
      .default([]),
    photographer: z.string().min(1),

    /** One line, shown under titles and as the home-page hook. */
    essence: z.string().max(140),
    brief: z.string(),
    concept: z.string(),
    execution: z.string().optional(),
    /** Sketch or mood image beside the concept text. Renders are captioned as such. */
    conceptImage: picture.optional(),
    /** 2–3 documented site photographs for the execution section. */
    siteImages: z.array(picture).default([]),

    hero: z.object({
      desktop: image(),
      mobile: image(),
      alt: z.string().min(1),
      focal,
    }),
    /** Extra images for the home-page spreads (two portraits for spread B). */
    homeImages: z.array(picture).default([]),
    /** The walk through the home: 8–15 images in approved layouts. */
    sequence: z
      .array(
        z
          .object({
            layout: z.enum(SEQUENCE_LAYOUTS),
            caption: z.string().optional(),
            images: z.array(picture).min(1),
          })
          .refine((group) => group.images.length === IMAGES_PER_LAYOUT[group.layout], {
            message:
              'Image count must match the layout: full 1, pair 2, pair-offset 2, trio 3, spread 1',
          }),
      )
      .refine((groups) => groups.filter((g) => g.layout === 'spread').length <= 1, {
        message: 'At most one 21:9 spread per case study',
      })
      .default([]),
    details: z
      .array(z.object({ src: image(), alt: z.string().min(1), caption: z.string().min(1) }))
      .default([]),
    madeForThisHome: z
      .array(
        z.object({
          name: z.string(),
          material: z.string(),
          maker: z.string().optional(),
          image: image(),
          alt: z.string().min(1),
        }),
      )
      .default([]),
    plan: z
      .object({
        /** SVG file beside index.md; rooms are elements with data-room="<id>". */
        svg: z.string().regex(/\.svg$/),
        /** Text description of the plan for screen readers. */
        description: z.string(),
        steps: z.array(z.object({ room: z.string(), label: z.string(), text: z.string() })).min(1),
      })
      .optional(),
    beforeAfter: z
      .array(z.object({ before: image(), after: image(), alt: z.string().min(1) }))
      .default([]),
    film: z
      .object({
        src: z.string(),
        poster: image(),
        captions: z.string().optional(),
        durationSec: z.number().positive(),
      })
      .optional(),
    testimonial: z
      .object({ quote: z.string(), attribution: z.string(), permissionRef: z.string().min(1) })
      .optional(),

    featured: z.boolean().default(false),
    homeOrder: z.number().int().optional(),
    indexOrder: z.number().int(),
    related: z.array(z.string()).default([]),
    seo: z
      .object({
        title: z.string().optional(),
        description: z.string().optional(),
        ogImage: z.string().optional(),
      })
      .default({}),

    /** Only published projects with verified facts and credits reach production. */
    published: z.boolean().default(false),
    verified: z.object({
      facts: z.boolean(),
      testimonial: z.boolean().optional(),
      credits: z.boolean(),
    }),
  });
};

const projects = defineCollection({
  loader: glob({ pattern: '*/index.md', base: './src/content/projects' }),
  schema: projectSchema,
});

// Fixtures load only in `astro dev`. Production points the loader at an empty folder, so fixture
// images are never processed into the build output.
const projectFixtures = defineCollection({
  loader: glob({
    pattern: '*/index.md',
    base: SHOW_FIXTURES ? './src/fixtures/projects' : './src/fixtures/production-empty',
  }),
  schema: projectSchema,
});

const press = defineCollection({
  loader: glob({ pattern: '*.yaml', base: './src/content/press' }),
  schema: z.object({
    publication: z.string(),
    title: z.string(),
    year: z.number().int(),
    url: z.url().optional(),
    verified: z.boolean(),
  }),
});

const testimonials = defineCollection({
  loader: glob({ pattern: '*.yaml', base: './src/content/testimonials' }),
  schema: z.object({
    quote: z.string(),
    /** Discreet attribution, e.g. "Owner, villa, Palm Jumeirah". */
    attribution: z.string(),
    /** Reference to the written permission on file. */
    permissionRef: z.string().min(1),
    project: z.string().optional(),
    verified: z.boolean(),
  }),
});

/** Long-form page copy (approach, studio). Published only when the studio has signed it off. */
const pageSchema = z.object({
  title: z.string(),
  /** Meta description; facts only. */
  description: z.string(),
  /** Opening statement under the title. */
  intro: z.string().optional(),
  published: z.boolean().default(false),
});

const pages = defineCollection({
  loader: glob({ pattern: ['*.md', '!README.md'], base: './src/content/pages' }),
  schema: pageSchema,
});

const pageFixtures = defineCollection({
  loader: glob({
    pattern: ['*.md', '!README.md'],
    base: SHOW_FIXTURES ? './src/fixtures/pages' : './src/fixtures/production-empty',
  }),
  schema: pageSchema,
});

/** FAQ on /approach: fees approach, timelines, working between cities, Vastu, what we don't do. */
const faqSchema = z.object({
  question: z.string(),
  answer: z.string(),
  order: z.number().int(),
  published: z.boolean().default(false),
});

const faq = defineCollection({
  loader: glob({ pattern: '*.yaml', base: './src/content/faq' }),
  schema: faqSchema,
});

const faqFixtures = defineCollection({
  loader: glob({
    pattern: '*.yaml',
    base: SHOW_FIXTURES ? './src/fixtures/faq' : './src/fixtures/production-empty',
  }),
  schema: faqSchema,
});

/** People on /studio, with their consent to be shown [V21]. */
const teamSchema = ({ image }: SchemaContext) =>
  z.object({
    name: z.string(),
    role: z.string(),
    /** One credential line, e.g. training and founding year [V1]. */
    credential: z.string().optional(),
    portrait: image().optional(),
    portraitAlt: z.string().optional(),
    founder: z.boolean().default(false),
    order: z.number().int(),
    /** Written consent to appear on the site. */
    consent: z.boolean(),
    published: z.boolean().default(false),
  });

const team = defineCollection({
  loader: glob({ pattern: ['*.md', '!README.md'], base: './src/content/team' }),
  schema: teamSchema,
});

const teamFixtures = defineCollection({
  loader: glob({
    pattern: ['*.md', '!README.md'],
    base: SHOW_FIXTURES ? './src/fixtures/team' : './src/fixtures/production-empty',
  }),
  schema: teamSchema,
});

export const collections = {
  projects,
  projectFixtures,
  press,
  testimonials,
  pages,
  pageFixtures,
  faq,
  faqFixtures,
  team,
  teamFixtures,
};
