/**
 * Site settings. Every value here is a public claim about the studio, so anything not yet
 * confirmed by Neha/the studio is `null` and the UI omits it. The V-codes refer to the
 * [VERIFY] register in docs/implementation-plan.md §7.
 *
 * Never fill a field with a guess or a sample value: an omitted phone number is better than a
 * wrong one.
 */

export type Region = 'mumbai' | 'dubai';

export interface Office {
  region: Region;
  city: string;
  country: string;
  /** Street address of real premises only [V16]. */
  address: string | null;
  /** Shown as "by appointment" when there are no premises to list [V16]. */
  byAppointment: boolean;
  /** Full international format for display, e.g. "+91 98xxx xxxxx" [V17]. */
  phone: string | null;
  /** Digits only, country code first, no "+", spaces or leading zero [V17]. */
  whatsapp: string | null;
  /** Studio-domain address, never a personal mailbox [V18]. */
  email: string | null;
  /** Trade licence / registration shown in the footer where applicable [V16]. */
  licence: string | null;
  geo: { latitude: number; longitude: number } | null;
}

export interface SiteSettings {
  name: string;
  /** Short line used in meta descriptions and the footer. Facts only. */
  description: string;
  /** Wordmark SVG path under /public, once supplied [V20]. Text wordmark until then. */
  wordmarkSrc: string | null;
  /** General studio email [V18]. */
  email: string | null;
  offices: Office[];
  socials: { label: string; url: string }[];
  /** Reply promise shown beside contact options [V14]. */
  replyPromise: string | null;
  /** Default Open Graph image under /public [V5]. */
  defaultOgImage: string | null;
  locale: string;
}

export const site: SiteSettings = {
  name: 'interiordesignbyneha',
  description: 'Interior design studio for homes in Mumbai and Dubai.',
  wordmarkSrc: null, // [V20]
  email: null, // [V18]
  offices: [
    {
      region: 'mumbai',
      city: 'Mumbai',
      country: 'India',
      address: null, // [V16]
      byAppointment: true,
      phone: null, // [V17]
      whatsapp: null, // [V17] e.g. "91XXXXXXXXXX" once confirmed
      email: null, // [V18]
      licence: null, // [V16]
      geo: null,
    },
    {
      region: 'dubai',
      city: 'Dubai',
      country: 'United Arab Emirates',
      address: null, // [V16]
      byAppointment: true,
      phone: null, // [V17]
      whatsapp: null, // [V17] e.g. "971XXXXXXXXX" once confirmed
      email: null, // [V18]
      licence: null, // [V16]
      geo: null,
    },
  ],
  socials: [], // [V19] e.g. { label: 'Instagram', url: 'https://www.instagram.com/…' }
  replyPromise: null, // [V14]
  defaultOgImage: null, // [V5]
  locale: 'en_GB',
};

/** Services the enquiry form and /approach can offer (brief §12). */
export const SERVICES = {
  'design-execution': 'Full design and execution',
  'design-only': 'Design only',
} as const;
export type ServiceId = keyof typeof SERVICES;

/**
 * Services actually offered in each city [V3, V4]. Must match the studio's real model and
 * licences (in Dubai, design consultancy and fit-out contracting are separately licensed).
 * Empty until confirmed: /approach then omits the services table and the enquiry form offers only
 * "Not sure yet".
 */
export const servicesByCity: Record<Region, ServiceId[]> = {
  mumbai: [], // [V4]
  dubai: [], // [V4]
};

/**
 * Enquiry answer bands [V15]. Null until Neha confirms them; the size and budget questions are
 * hidden while null. INR bands show for Mumbai/elsewhere, AED for Dubai, both for "Both".
 */
export const enquiryBands: {
  sizeSqft: string[] | null;
  budgetINR: string[] | null;
  budgetAED: string[] | null;
} = {
  sizeSqft: null, // [V15]
  budgetINR: null, // [V15]
  budgetAED: null, // [V15]
};

/** Workshops and makers named on /studio, each with consent [V24]. */
export const craftPartners: { name: string; craft: string; city: string }[] = [];

export interface NavItem {
  label: string;
  href: string;
}

/** Primary navigation, in header order. Items render only once their page exists. */
export const primaryNav: NavItem[] = [
  { label: 'Projects', href: '/projects' },
  { label: 'Approach', href: '/approach' },
  { label: 'Studio', href: '/studio' },
];

export const enquiryCta: NavItem = { label: 'Discuss your project', href: '/enquire' };

/** Footer navigation. Items render only once their page exists. */
export const footerNav: NavItem[] = [
  ...primaryNav,
  { label: 'Enquire', href: '/enquire' },
  { label: 'Privacy', href: '/privacy' },
];

/** Default WhatsApp prefill (brief §12). */
export function whatsappMessage(from: string): string {
  return `Hello, I'm interested in discussing a project. (From: ${from})`;
}
