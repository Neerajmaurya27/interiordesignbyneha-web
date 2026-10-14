/**
 * JSON-LD builders (brief §13). Only verified facts from src/data/site.ts are emitted: an office
 * appears as a LocalBusiness only when it has a real address, and empty fields are dropped.
 * schema.org has no InteriorDesigner type, so additionalType points at the Wikipedia concept.
 */
import type { Office, SiteSettings } from '../data/site';

type Json = string | number | boolean | null | Json[] | { [key: string]: Json | undefined };
export type JsonLd = { [key: string]: Json | undefined };

const INTERIOR_DESIGN = 'https://en.wikipedia.org/wiki/Interior_design';

function compact<T extends JsonLd>(obj: T): T {
  return Object.fromEntries(
    Object.entries(obj).filter(
      ([, v]) => v !== null && v !== undefined && !(Array.isArray(v) && v.length === 0),
    ),
  ) as T;
}

function officeNode(office: Office, settings: SiteSettings, siteUrl: string): JsonLd | null {
  if (!office.address) return null;
  return compact({
    '@type': ['LocalBusiness', 'ProfessionalService'],
    '@id': new URL(`#office-${office.region}`, siteUrl).href,
    additionalType: INTERIOR_DESIGN,
    name: `${settings.name}, ${office.city}`,
    url: siteUrl,
    telephone: office.phone,
    email: office.email,
    areaServed: office.city,
    address: {
      '@type': 'PostalAddress',
      streetAddress: office.address,
      addressLocality: office.city,
      addressCountry: office.country,
    },
    geo: office.geo ? { '@type': 'GeoCoordinates', ...office.geo } : null,
    sameAs: settings.socials.map((s) => s.url),
  });
}

export function organizationJsonLd(settings: SiteSettings, siteUrl: string): JsonLd {
  const offices = settings.offices
    .map((office) => officeNode(office, settings, siteUrl))
    .filter((node): node is JsonLd => node !== null);

  const organization = compact({
    '@type': 'Organization',
    '@id': new URL('#organization', siteUrl).href,
    additionalType: INTERIOR_DESIGN,
    name: settings.name,
    url: siteUrl,
    email: settings.email,
    logo: settings.wordmarkSrc ? new URL(settings.wordmarkSrc, siteUrl).href : null,
    sameAs: settings.socials.map((s) => s.url),
  });

  return { '@context': 'https://schema.org', '@graph': [organization, ...offices] };
}

export interface Crumb {
  name: string;
  href: string;
}

export function breadcrumbJsonLd(crumbs: Crumb[], siteUrl: string): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((crumb, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: crumb.name,
      item: new URL(crumb.href, siteUrl).href,
    })),
  };
}

/** Serialises JSON-LD for an inline <script>, escaping "<" so content cannot close the tag. */
export function serializeJsonLd(data: JsonLd): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}
