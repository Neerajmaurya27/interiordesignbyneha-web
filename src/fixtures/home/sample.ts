/**
 * DEVELOPMENT SAMPLE — the brief's sample copy and labelled fixture images, used only by
 * `astro dev` to lay out the home page. Every string is unverified; none of it may be copied
 * into src/data/home.ts without the studio confirming it.
 */
import type { HomeContent } from '../../data/home';
import heroDesktop from './home-hero-landscape.jpg';
import heroMobile from './home-hero-portrait.jpg';
import portrait from './portrait-neha.jpg';
import d1 from './detail-01.jpg';
import d2 from './detail-02.jpg';
import d3 from './detail-03.jpg';
import d4 from './detail-04.jpg';
import d5 from './detail-05.jpg';
import p1 from './process-01.jpg';
import p2 from './process-02.jpg';
import p3 from './process-03.jpg';
import p4 from './process-04.jpg';
import p5 from './process-05.jpg';

export const sampleHome: HomeContent = {
  hero: {
    desktop: heroDesktop,
    mobile: heroMobile,
    alt: 'Fixture image standing in for the hero photograph',
    headline:
      'Complete interiors for homes in Mumbai and Dubai, designed and detailed by one studio. [VERIFY]',
    support:
      'We take on a small number of residences each year and see each one through from first drawing to the last fitted cabinet. [VERIFY]',
    caption: 'Sea-facing residence, Worli, Mumbai · 2025 [VERIFY]',
  },
  fallbackHeadline: 'Interior design for homes in Mumbai and Dubai.',
  selectedWorkHandOff: 'Every one of these homes was decided in the details. [VERIFY]',
  details: [
    {
      src: d1,
      alt: 'Fixture detail 01',
      caption: 'Book-matched Statuario marble, hand-finished on site [VERIFY]',
    },
    {
      src: d2,
      alt: 'Fixture detail 02',
      caption: 'Fluted teak joinery by [workshop], [city] [VERIFY]',
    },
    { src: d3, alt: 'Fixture detail 03', caption: 'Sample caption for a third close-up [VERIFY]' },
    { src: d4, alt: 'Fixture detail 04', caption: 'Sample caption for a fourth close-up [VERIFY]' },
    { src: d5, alt: 'Fixture detail 05', caption: 'Sample caption for a fifth close-up [VERIFY]' },
  ],
  pointOfView: {
    statement:
      'I start with how a family lives, not with a style. Light, proportion and a few honest materials do most of the work; the rest is detail, drawn properly and checked on site. I would rather design fewer homes and know every one of them. [VERIFY: Neha rewrites]',
    portrait: { src: portrait, alt: 'Fixture image standing in for a portrait of Neha' },
    signature: 'Neha',
    credential: 'Trained as an architect at [institution]; founded the studio in [year]. [VERIFY]',
  },
  process: {
    steps: [
      {
        title: 'Brief and site',
        text: 'Sample sentence for this step. [VERIFY]',
        image: { src: p1, alt: 'Fixture process image 01' },
      },
      {
        title: 'Concept and planning',
        text: 'Sample sentence for this step. [VERIFY]',
        image: { src: p2, alt: 'Fixture process image 02' },
      },
      {
        title: 'Design development and materials',
        text: 'Sample sentence for this step. [VERIFY]',
        image: { src: p3, alt: 'Fixture process image 03' },
      },
      {
        title: 'Coordination and execution',
        text: 'Sample sentence for this step. [VERIFY]',
        image: { src: p4, alt: 'Fixture process image 04' },
      },
      {
        title: 'Handover and aftercare',
        text: 'Sample sentence for this step. [VERIFY]',
        image: { src: p5, alt: 'Fixture process image 05' },
      },
    ],
    delivery:
      'In Mumbai we manage execution through our own site team; in Dubai we work alongside licensed fit-out partners. [VERIFY — must match real model and licences]',
  },
  enquiry: {
    heading: 'Planning a home in Mumbai, Dubai or between the two?',
    support:
      'Tell us a little about it. We work on complete residences of about [3,000] sq ft and above, and a small number of hospitality projects. [VERIFY]',
    suitability: [
      'Sample suitability fact one [VERIFY]',
      'Sample suitability fact two [VERIFY]',
      'Sample suitability fact three [VERIFY]',
    ],
  },
};

/** Sample credibility items for layout only. Not real publications. */
export const sampleCredibility = {
  press: [
    { publication: 'Publication name [VERIFY]', title: 'Feature title [VERIFY]', year: 2026 },
    { publication: 'Publication name [VERIFY]', title: 'Award or list [VERIFY]', year: 2025 },
    { publication: 'Publication name [VERIFY]', title: 'Feature title [VERIFY]', year: 2024 },
  ],
  testimonial: {
    quote: 'Sample quote, used only to lay out this chapter. [VERIFY with written permission]',
    attribution: 'Owner, villa, Palm Jumeirah [VERIFY]',
  },
};
