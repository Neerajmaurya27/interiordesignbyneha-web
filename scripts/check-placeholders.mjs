#!/usr/bin/env node
/**
 * Placeholder guard (plan §7). Fails the production build if unverified or placeholder text
 * ships: "[VERIFY", "lorem", "TODO" or "placeholder" in built HTML/XML/TXT/JSON.
 * HTML placeholder="" attributes and the `::placeholder` pseudo-element are allowed.
 */
import { readdir, readFile } from 'node:fs/promises';
import { join, extname, relative } from 'node:path';

const root = new URL('../dist/', import.meta.url).pathname;
const exts = new Set(['.html', '.xml', '.txt', '.json', '.webmanifest']);
const patterns = [/\[VERIFY/i, /\blorem\b/i, /\bTODO\b/, /placeholder/i];

async function* walk(dir) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(path);
    else if (exts.has(extname(entry.name))) yield path;
  }
}

const problems = [];
for await (const file of walk(root)) {
  const text = (await readFile(file, 'utf8'))
    .replace(/\splaceholder=("[^"]*"|'[^']*')/gi, '')
    .replace(/::?placeholder/gi, '');
  text.split('\n').forEach((line, i) => {
    for (const pattern of patterns) {
      if (pattern.test(line)) {
        problems.push(
          `${relative(root, file)}:${i + 1} matches ${pattern}: ${line.trim().slice(0, 120)}`,
        );
      }
    }
  });
}

if (problems.length > 0) {
  console.error(`Placeholder guard failed (${problems.length}):\n${problems.join('\n')}`);
  process.exit(1);
}
console.log('Placeholder guard: clean.');
