#!/usr/bin/env node
/**
 * Launch gate (plan §7, V5–V7). Run after `pnpm build` before going live:
 *   pnpm launch:check
 * Ordinary builds succeed without studio content so CI stays useful; this check fails until the
 * built home page has a real hero photograph and published selected work.
 */
import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('../dist/index.html', import.meta.url), 'utf8').catch(
  () => null,
);
if (!html) {
  console.error('Launch check: dist/index.html not found. Run `pnpm build` first.');
  process.exit(1);
}

const checks = [
  {
    ok: /<img[^>]*fetchpriority="high"/.test(html),
    message: 'Home hero photograph is missing (src/data/home.ts → hero) [V5].',
  },
  {
    ok: html.includes('data-chapter="02"'),
    message: 'No published, verified projects are featured on the home page [V6].',
  },
];

const failed = checks.filter((c) => !c.ok);
if (failed.length > 0) {
  console.error(`Launch check failed:\n${failed.map((c) => `- ${c.message}`).join('\n')}`);
  process.exit(1);
}
console.log('Launch check: passed.');
