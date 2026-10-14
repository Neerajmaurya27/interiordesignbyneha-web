/**
 * Home-page content (brief §7). Like site.ts, this file holds only verified content: anything
 * still waiting on the studio is null or empty, and its chapter does not render.
 * During `astro dev` the empty parts are filled from src/fixtures/home/sample.ts so the layout
 * can be reviewed; that sample never reaches a production build.
 */
import type { ImageMetadata } from 'astro';
import { SHOW_FIXTURES } from '../lib/preview';

export interface HomeImage {
  src: ImageMetadata;
  alt: string;
  focal?: string;
}

export interface HomeContent {
  /** Chapter 01. A real photograph of a completed project [V5]; null shows a text-only opening. */
  hero: {
    desktop: ImageMetadata;
    mobile: ImageMetadata;
    alt: string;
    focal?: string;
    headline: string;
    support: string | null;
    /** Names the project, e.g. "Sea-facing residence, Worli, Mumbai · 2025". */
    caption: string | null;
  } | null;
  /** H1 when there is no hero photograph yet. Facts only. */
  fallbackHeadline: string;
  /** Chapter 02 closing line [V9]. */
  selectedWorkHandOff: string | null;
  /** Chapter 03 close-ups with real captions [V8]. */
  details: (HomeImage & { caption: string })[];
  /** Chapter 04, in Neha's own words [V1, V2]. */
  pointOfView: {
    statement: string;
    portrait: HomeImage | null;
    signature: string;
    credential: string | null;
  } | null;
  /** Chapter 05 [V3, V22]. */
  process: {
    steps: { title: string; text: string; image: HomeImage | null }[];
    /** How delivery works in each city; must match real licences [V3]. */
    delivery: string | null;
  } | null;
  /** Chapter 07. */
  enquiry: {
    heading: string;
    /** Size threshold sentence [V12]. */
    support: string | null;
    /** Three suitability facts [V13]. */
    suitability: string[];
  };
}

export const home: HomeContent = {
  hero: null, // [V5]
  fallbackHeadline: 'Interior design for homes in Mumbai and Dubai.',
  selectedWorkHandOff: null, // [V9]
  details: [], // [V8]
  pointOfView: null, // [V1, V2]
  process: null, // [V3, V22]
  enquiry: {
    heading: 'Planning a home in Mumbai, Dubai or between the two?',
    support: null, // [V12]
    suitability: [], // [V13]
  },
};

/**
 * Returns the home content for this build. In development, empty chapters are filled from the
 * sample so every chapter can be designed; production returns the verified content unchanged.
 */
export async function loadHome(): Promise<{ content: HomeContent; usesSample: boolean }> {
  if (!SHOW_FIXTURES) return { content: home, usesSample: false };
  const { sampleHome } = await import('../fixtures/home/sample');
  return {
    usesSample: true,
    content: {
      hero: home.hero ?? sampleHome.hero,
      fallbackHeadline: home.fallbackHeadline,
      selectedWorkHandOff: home.selectedWorkHandOff ?? sampleHome.selectedWorkHandOff,
      details: home.details.length > 0 ? home.details : sampleHome.details,
      pointOfView: home.pointOfView ?? sampleHome.pointOfView,
      process: home.process ?? sampleHome.process,
      enquiry: {
        heading: home.enquiry.heading,
        support: home.enquiry.support ?? sampleHome.enquiry.support,
        suitability:
          home.enquiry.suitability.length > 0
            ? home.enquiry.suitability
            : sampleHome.enquiry.suitability,
      },
    },
  };
}
