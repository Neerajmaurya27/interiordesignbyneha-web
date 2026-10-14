/**
 * Enquiry form definition (brief §12): the answer options and one Zod schema used by the server
 * for every submission. Error messages are written as instructions, in words.
 */
import { z } from 'astro/zod';
import type { Region, ServiceId } from '../data/site';
import { SERVICES } from '../data/site';

export const PROJECT_TYPES = {
  apartment: 'Apartment or penthouse',
  villa: 'Villa',
  hospitality: 'Hospitality',
  commercial: 'Commercial',
  collaboration: 'Collaboration (architect or developer)',
} as const;

export const LOCATIONS = {
  mumbai: 'Mumbai',
  dubai: 'Dubai',
  both: 'Both',
  elsewhere: 'Elsewhere',
} as const;

export const TIMINGS = {
  'within-3': 'Ready to start within 3 months',
  '3-6': '3–6 months',
  '6-12': '6–12 months',
  exploring: 'Exploring',
} as const;

export const SOURCES = {
  referral: 'Referral – friend or client',
  architect: 'Architect or developer',
  instagram: 'Instagram',
  search: 'Search',
  press: 'Press',
  other: 'Other',
} as const;

export const NOT_SURE = 'not-sure';
export type ServiceChoice = ServiceId | typeof NOT_SURE;
export const SERVICE_CHOICES: Record<ServiceChoice, string> = {
  ...SERVICES,
  [NOT_SURE]: 'Not sure yet',
};

type Location = keyof typeof LOCATIONS;

export interface EnquiryConfig {
  servicesByCity: Record<Region, ServiceId[]>;
  bands: { sizeSqft: string[] | null; budgetINR: string[] | null; budgetAED: string[] | null };
}

/** Services that may be chosen for a location: only those genuinely offered there, plus "Not sure". */
export function servicesFor(location: Location | '', config: EnquiryConfig): ServiceChoice[] {
  const { mumbai, dubai } = config.servicesByCity;
  let offered: ServiceId[];
  if (location === 'mumbai') offered = mumbai;
  else if (location === 'dubai') offered = dubai;
  else if (location === 'both') offered = mumbai.filter((s) => dubai.includes(s));
  else offered = [...new Set([...mumbai, ...dubai])];
  return [...offered, NOT_SURE];
}

/** Budget bands for a location: INR for Mumbai/elsewhere, AED for Dubai, both for "Both". */
export function budgetBandsFor(location: Location | '', config: EnquiryConfig): string[] {
  const { budgetINR, budgetAED } = config.bands;
  if (location === 'dubai') return budgetAED ?? [];
  if (location === 'both') return [...(budgetINR ?? []), ...(budgetAED ?? [])];
  return budgetINR ?? [];
}

const PHONE = /^\+[1-9][0-9 ()-]{6,22}$/;
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v ? v : undefined));

const keys = <T extends Record<string, string>>(o: T) =>
  Object.keys(o) as [keyof T & string, ...(keyof T & string)[]];

export function enquirySchema(config: EnquiryConfig) {
  return z
    .object({
      name: z
        .string('Enter your full name')
        .trim()
        .min(2, 'Enter your full name')
        .max(120, 'Use 120 characters or fewer'),
      email: z
        .string('Enter an email address in the format name@example.com')
        .trim()
        .pipe(z.email('Enter an email address in the format name@example.com')),
      phone: z
        .string(
          'Enter a phone number with the country code, like +91 98765 43210 or +971 50 123 4567',
        )
        .trim()
        .regex(
          PHONE,
          'Enter a phone number with the country code, like +91 98765 43210 or +971 50 123 4567',
        ),
      projectType: z.enum(keys(PROJECT_TYPES), 'Choose the type of project'),
      location: z.enum(keys(LOCATIONS), 'Choose where the project is'),
      locationOther: optionalText(120),
      size: optionalText(60),
      budget: optionalText(60),
      services: z.array(z.string()).default([]),
      timing: z.enum(keys(TIMINGS), 'Choose when you would like to start'),
      message: optionalText(4000),
      source: z
        .enum(keys(SOURCES))
        .optional()
        .or(z.literal('').transform(() => undefined)),
      consent: z.literal('yes', 'Tick the box to agree, so we can reply to you'),
      marketing: z
        .literal('yes')
        .optional()
        .transform((v) => v === 'yes'),
      // Hidden context fields.
      sourcePage: optionalText(200),
      project: z
        .string()
        .regex(/^[a-z0-9-]{1,80}$/)
        .optional()
        .or(z.literal('').transform(() => undefined)),
      referrer: optionalText(500),
      utmSource: optionalText(100),
      utmMedium: optionalText(100),
      utmCampaign: optionalText(100),
    })
    .superRefine((data, ctx) => {
      if (data.location === 'elsewhere' && !data.locationOther) {
        ctx.addIssue({
          code: 'custom',
          path: ['locationOther'],
          message: 'Tell us the city and country',
        });
      }
      const sizes = config.bands.sizeSqft ?? [];
      if (data.size && !sizes.includes(data.size)) {
        ctx.addIssue({ code: 'custom', path: ['size'], message: 'Choose one of the size options' });
      }
      const budgets = budgetBandsFor(data.location, config);
      if (data.budget && !budgets.includes(data.budget)) {
        ctx.addIssue({
          code: 'custom',
          path: ['budget'],
          message: 'Choose one of the budget options',
        });
      }
      const allowed = servicesFor(data.location, config);
      if (data.services.some((s) => !allowed.includes(s as ServiceChoice))) {
        ctx.addIssue({
          code: 'custom',
          path: ['services'],
          message: 'Choose services offered for this location',
        });
      }
    })
    .transform((data) => ({
      ...data,
      services: (data.services.length > 0 ? data.services : [NOT_SURE]) as ServiceChoice[],
    }));
}

export type Enquiry = z.output<ReturnType<typeof enquirySchema>>;

/** Turns FormData into the plain object the schema expects (multi-select → array). */
export function formToObject(form: FormData): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key of new Set(form.keys())) {
    const values = form.getAll(key).filter((v): v is string => typeof v === 'string');
    out[key] = key === 'services' ? values : values[0];
  }
  return out;
}
