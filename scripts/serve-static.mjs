#!/usr/bin/env node
/**
 * Minimal static server for dist/client (the prerendered pages), used by Lighthouse CI.
 * Resolves /path → /path.html or /path/index.html, sets content types and long caching for
 * hashed assets, and serves 404.html for anything missing. Usage: node scripts/serve-static.mjs [port]
 */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { createGzip } from 'node:zlib';
import { Readable } from 'node:stream';

const root = new URL('../dist/client/', import.meta.url).pathname;
const port = Number(process.argv[2] ?? 4323);
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.avif': 'image/avif',
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
  '.xml': 'application/xml',
  '.txt': 'text/plain; charset=utf-8',
};
const COMPRESS = new Set(['.html', '.css', '.js', '.svg', '.xml', '.txt']);

async function find(urlPath) {
  const clean = normalize(decodeURIComponent(urlPath)).replace(/^(\.\.[/\\])+/, '');
  for (const candidate of [clean, `${clean}.html`, join(clean, 'index.html')]) {
    const file = join(root, candidate);
    try {
      if ((await stat(file)).isFile()) return file;
    } catch {
      // try the next candidate
    }
  }
  return null;
}

createServer(async (req, res) => {
  const path = new URL(req.url ?? '/', 'http://localhost').pathname;
  const file = (await find(path)) ?? join(root, '404.html');
  const status = file.endsWith('404.html') && !path.startsWith('/404') ? 404 : 200;
  const ext = extname(file);
  const headers = {
    'Content-Type': TYPES[ext] ?? 'application/octet-stream',
    'Cache-Control': path.startsWith('/_astro/')
      ? 'public, max-age=31536000, immutable'
      : 'no-cache',
  };
  const body = await readFile(file);
  if (COMPRESS.has(ext) && /gzip/.test(req.headers['accept-encoding'] ?? '')) {
    res.writeHead(status, { ...headers, 'Content-Encoding': 'gzip' });
    Readable.from(body).pipe(createGzip()).pipe(res);
  } else {
    res.writeHead(status, headers);
    res.end(body);
  }
}).listen(port, () => console.log(`Serving dist/client at http://localhost:${port}`));
