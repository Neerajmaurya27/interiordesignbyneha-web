/**
 * Content collections (plan §10). Projects live in src/content/projects/<slug>/index.md with
 * their images alongside. Development-only fixtures live in src/fixtures/projects and are
 * never read by production builds (see src/lib/projects.ts).
 */
import { defineCollection, type SchemaContext } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

export const PROJECT_TYPES = [
  'residence',
  'villa',
  'penthouse',
  'hospitality',
  'commercial',
] as const;
export const REGIONS = ['mumbai', 'dubai', 'other'] as const;

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

    hero: z.object({
      desktop: image(),
      mobile: image(),
      alt: z.string().min(1),
      focal,
    }),
    /** Extra images for the home-page spreads (two portraits for spread B). */
    homeImages: z.array(picture).default([]),
    sequence: z
      .array(
        z.object({
          layout: z.enum(['full', 'pair', 'pair-offset', 'trio', 'spread']),
          caption: z.string().optional(),
          images: z.array(picture).min(1),
        }),
      )
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
        svg: z.string(),
        description: z.string(),
        steps: z.array(z.object({ room: z.string(), text: z.string() })),
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
    base: import.meta.env.DEV ? './src/fixtures/projects' : './src/fixtures/production-empty',
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

export const collections = { projects, projectFixtures, press, testimonials };
