#!/usr/bin/env node
/**
 * Internal link check on the build output: every root-relative href/src must resolve to a built
 * file (page, asset or the /enquire Worker route), and every in-page #anchor must exist.
 * External links are checked separately by lychee in CI.
 */
import { access } from 'node:fs/promises';
import { join } from 'node:path';
import { CLIENT, pages, tags } from './lib-dist.mjs';

const SERVER_ROUTES = new Set(['/enquire']);
const exists = (p) =>
  access(p).then(
    () => true,
    () => false,
  );

async function resolves(path) {
  if (SERVER_ROUTES.has(path)) return true;
  const clean = decodeURI(path).replace(/\/$/, '') || '/';
  const candidates =
    clean === '/'
      ? [join(CLIENT, 'index.html')]
      : [join(CLIENT, clean), join(CLIENT, `${clean}.html`), join(CLIENT, clean, 'index.html')];
  for (const c of candidates) if (await exists(c)) return true;
  return false;
}

const all = await pages();
const problems = [];
const checked = new Map();

for (const { route, html } of all) {
  const ids = new Set(
    tags(html, '[a-z0-9-]+')
      .map((a) => a.id)
      .filter(Boolean),
  );
  const refs = [
    ...tags(html, 'a').map((a) => a.href),
    ...tags(html, 'link').map((l) => l.href),
    ...tags(html, 'img').map((i) => i.src),
    ...tags(html, 'source').flatMap((s) =>
      (s.srcset ?? '').split(',').map((x) => x.trim().split(/\s+/)[0]),
    ),
    ...tags(html, 'script').map((s) => s.src),
  ].filter(Boolean);

  for (const ref of refs) {
    if (ref.startsWith('#')) {
      if (ref.length > 1 && !ids.has(decodeURIComponent(ref.slice(1)))) {
        problems.push(`${route}: missing anchor ${ref}`);
      }
      continue;
    }
    if (!ref.startsWith('/') || ref.startsWith('//')) continue;
    const path = ref.split(/[?#]/)[0];
    if (!checked.has(path)) checked.set(path, await resolves(path));
    if (!checked.get(path)) problems.push(`${route}: broken link ${ref}`);
  }
}

if (problems.length > 0) {
  console.error(`Link check failed (${problems.length}):\n${[...new Set(problems)].join('\n')}`);
  process.exit(1);
}
console.log(`Link check: ${checked.size} internal targets across ${all.length} pages resolve.`);
