/** Shared helpers for build-output audits. */
import { readdir, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';

export const CLIENT = new URL('../dist/client/', import.meta.url).pathname;

export async function htmlFiles(dir = CLIENT) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await htmlFiles(path)));
    else if (entry.name.endsWith('.html')) out.push(path);
  }
  return out;
}

export async function pages() {
  return Promise.all(
    (await htmlFiles()).map(async (file) => ({
      file,
      route:
        '/' +
        relative(CLIENT, file)
          .replace(/(^|\/)index\.html$/, '')
          .replace(/\.html$/, ''),
      html: await readFile(file, 'utf8'),
    })),
  );
}

/** Attributes of every <tag ...> in the HTML (simple parser for our own generated markup). */
export function tags(html, name) {
  const re = new RegExp(`<${name}\\b([^>]*)>`, 'gi');
  return [...html.matchAll(re)].map((m) => {
    const attrs = {};
    for (const a of m[1].matchAll(/([:@\w-]+)(?:=("[^"]*"|'[^']*'|[^\s"'>]+))?/g)) {
      attrs[a[1].toLowerCase()] = a[2] === undefined ? '' : a[2].replace(/^["']|["']$/g, '');
    }
    return attrs;
  });
}
