#!/usr/bin/env node
/**
 * Asset inventory (plan §7, §11). Lists, per project, which images exist and flags problems:
 *  - referenced image files that are missing
 *  - masters below 2560px on the long edge (warning)
 *  - fewer than 8 sequence images or no detail close-ups (warning)
 *  - missing photographer credit or unverified facts (warning)
 * Usage: pnpm assets            (src/content/projects)
 *        pnpm assets --fixtures (src/fixtures/projects, for a dry run)
 * Exits 1 when a referenced file is missing.
 */
import { readdir, readFile, access } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { parse } from 'yaml';
import sharp from 'sharp';

const base = resolve(
  process.argv.includes('--fixtures') ? 'src/fixtures/projects' : 'src/content/projects',
);
const MIN_LONG_EDGE = 2560;

const exists = (p) =>
  access(p).then(
    () => true,
    () => false,
  );

async function imageInfo(dir, rel) {
  const path = join(dir, rel);
  if (!(await exists(path))) return { rel, missing: true };
  const { width = 0, height = 0 } = await sharp(path).metadata();
  return { rel, width, height, undersized: Math.max(width, height) < MIN_LONG_EDGE };
}

const slugs = (await readdir(base, { withFileTypes: true }))
  .filter((d) => d.isDirectory())
  .map((d) => d.name);

if (slugs.length === 0) {
  console.log(`No projects in ${base}.`);
  process.exit(0);
}

let missingCount = 0;
const rows = [];
const notes = [];

for (const slug of slugs) {
  const dir = join(base, slug);
  const raw = await readFile(join(dir, 'index.md'), 'utf8').catch(() => null);
  if (!raw) continue;
  const data = parse(raw.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? '') ?? {};
  const seqImages = (data.sequence ?? []).flatMap((g) => g.images ?? []);
  const groups = {
    'hero desktop': data.hero?.desktop ? [data.hero.desktop] : [],
    'hero mobile': data.hero?.mobile ? [data.hero.mobile] : [],
    sequence: seqImages.map((i) => i.src),
    details: (data.details ?? []).map((d) => d.src),
    'made for home': (data.madeForThisHome ?? []).map((m) => m.image),
    'before/after': (data.beforeAfter ?? []).flatMap((b) => [b.before, b.after]),
    site: (data.siteImages ?? []).map((s) => s.src),
  };

  const cells = {};
  for (const [group, files] of Object.entries(groups)) {
    const infos = await Promise.all(files.map((f) => imageInfo(dir, f)));
    const missing = infos.filter((i) => i.missing);
    const small = infos.filter((i) => i.undersized);
    missingCount += missing.length;
    missing.forEach((i) => notes.push(`✗ ${slug}: missing file ${i.rel}`));
    small.forEach((i) =>
      notes.push(`! ${slug}: ${i.rel} is ${i.width}×${i.height} (< ${MIN_LONG_EDGE}px long edge)`),
    );
    cells[group] = files.length === 0 ? '—' : `${files.length - missing.length}/${files.length}`;
  }
  const plan = data.plan ? ((await exists(join(dir, data.plan.svg))) ? 'yes' : 'MISSING') : '—';
  if (plan === 'MISSING') {
    missingCount += 1;
    notes.push(`✗ ${slug}: missing plan ${data.plan.svg}`);
  }
  if (seqImages.length < 8)
    notes.push(`! ${slug}: ${seqImages.length} sequence images (brief asks for 8–15)`);
  if ((data.details ?? []).length === 0) notes.push(`! ${slug}: no detail close-ups`);
  if (!data.photographer) notes.push(`! ${slug}: no photographer credit`);
  if (!data.verified?.facts) notes.push(`! ${slug}: facts not verified`);

  rows.push({
    slug,
    ...cells,
    plan,
    facts: data.verified?.facts ? 'verified' : 'unverified',
    published: data.published ? 'yes' : 'no',
  });
}

console.table(rows);
if (notes.length > 0) console.log(notes.join('\n'));
if (missingCount > 0) {
  console.error(`\n${missingCount} referenced file(s) missing.`);
  process.exit(1);
}
