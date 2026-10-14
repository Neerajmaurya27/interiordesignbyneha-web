#!/usr/bin/env node
/**
 * Launch gate (plan §7, V5–V7). Run after `pnpm build` before going live:
 *   pnpm launch:check
 * Ordinary builds succeed without studio content so CI stays useful; this check fails until the
 * built site has a real hero photograph, published selected work, a working enquiry form and a
 * published privacy notice.
 */
import { access, readFile } from 'node:fs/promises';

const html = await readFile(new URL('../dist/client/index.html', import.meta.url), 'utf8').catch(
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
  {
    ok: html.includes('href="/enquire"'),
    message: 'The enquiry form is not enabled (PUBLIC_ENQUIRY_ENABLED and its services) [V25].',
  },
  {
    ok: await access(new URL('../dist/client/privacy.html', import.meta.url)).then(
      () => true,
      () => false,
    ),
    message: 'The privacy notice is not published (src/content/pages/privacy.md) [V26].',
  },
];

const failed = checks.filter((c) => !c.ok);
if (failed.length > 0) {
  console.error(`Launch check failed:\n${failed.map((c) => `- ${c.message}`).join('\n')}`);
  process.exit(1);
}
console.log('Launch check: passed.');
