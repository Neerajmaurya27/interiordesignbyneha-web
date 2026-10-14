#!/usr/bin/env node
/**
 * Image audit on the build output (brief §11, §16):
 *  - every <img> has width, height and an alt attribute (empty alt is allowed for decorative use)
 *  - at most one eager, fetchpriority="high" image per page (the LCP hero), nothing else eager
 *  - pages with a hero (home chapter 01, case-study hero) load it eagerly with high priority
 */
import { pages, tags } from './lib-dist.mjs';

const problems = [];
for (const { route, html } of await pages()) {
  const imgs = tags(html, 'img').filter((img) => !('data-lightbox-image' in img));
  for (const img of imgs) {
    const id = img.src?.slice(0, 60) ?? '(no src)';
    if (!img.width || !img.height) problems.push(`${route}: <img ${id}> is missing width/height`);
    if (!('alt' in img)) problems.push(`${route}: <img ${id}> has no alt attribute`);
  }
  const eager = imgs.filter((img) => img.loading === 'eager');
  const high = imgs.filter((img) => img.fetchpriority === 'high');
  if (eager.length > 1)
    problems.push(`${route}: ${eager.length} eager images (only the hero may be eager)`);
  if (high.length > 1) problems.push(`${route}: ${high.length} high-priority images`);
  const hasHero =
    /data-chapter="01"[\s\S]*?<img|class="project-hero/.test(html) && /<picture/.test(html);
  if (hasHero && /class="project-hero|class="hero"/.test(html) && high.length !== 1) {
    problems.push(`${route}: hero image must be eager with fetchpriority="high"`);
  }
}

if (problems.length > 0) {
  console.error(`Image audit failed (${problems.length}):\n${problems.join('\n')}`);
  process.exit(1);
}
console.log('Image audit: clean.');
