#!/usr/bin/env node
/**
 * Generates a flat-colour, clearly labelled fixture image for development layouts.
 * Usage: node scripts/make-fixture-image.mjs <out.jpg> <width> <height> <#hex> [label]
 */
import sharp from 'sharp';

const [out, w, h, colour, label = 'FIXTURE'] = process.argv.slice(2);
const width = Number(w);
const height = Number(h);
const size = Math.round(Math.min(width, height) / 22);
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
  <text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle"
    font-family="Arial, sans-serif" font-size="${size}" letter-spacing="${size / 4}"
    fill="#6b5e52" fill-opacity="0.55">${label} · NOT A PHOTOGRAPH</text>
</svg>`;

await sharp({ create: { width, height, channels: 3, background: colour } })
  .composite([{ input: Buffer.from(svg) }])
  .jpeg({ quality: 82 })
  .toFile(out);
console.log(out);
