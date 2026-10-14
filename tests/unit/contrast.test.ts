/**
 * Contrast guard for the colour tokens (plan §5). Reads src/styles/tokens.css so any token
 * change is re-checked against the pairings the design relies on.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync(new URL('../../src/styles/tokens.css', import.meta.url), 'utf8');

const tokens = Object.fromEntries(
  [...css.matchAll(/--color-([a-z-]+):\s*(#[0-9a-f]{6})/gi)].map((m) => [m[1]!, m[2]!]),
);

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}

export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi! + 0.05) / (lo! + 0.05);
}

function c(fg: string, bg: string) {
  const f = tokens[fg];
  const b = tokens[bg];
  if (!f || !b) throw new Error(`Missing token: ${!f ? fg : bg}`);
  return contrast(f, b);
}

describe('colour tokens', () => {
  it('defines all 16 brand colours', () => {
    expect(Object.keys(tokens)).toHaveLength(16);
  });

  // Normal-size text must reach 4.5:1 (WCAG 1.4.3).
  const text: Array<[string, string]> = [
    ['espresso', 'limewash'],
    ['espresso', 'paper'],
    ['espresso', 'stone'],
    ['taupe', 'limewash'],
    ['taupe', 'stone'],
    ['taupe', 'paper'],
    ['terracotta', 'limewash'],
    ['terracotta', 'paper'],
    ['paper', 'terracotta'],
    ['paper', 'terracotta-deep'],
    ['oak', 'limewash'],
    ['grey-muted', 'limewash'],
    ['olive', 'limewash'],
    ['sand', 'espresso'],
    ['brass', 'espresso'],
    ['limewash', 'espresso'],
    ['paper', 'espresso'],
  ];
  it.each(text)('%s text on %s is at least 4.5:1', (fg, bg) => {
    expect(c(fg, bg)).toBeGreaterThanOrEqual(4.5);
  });

  // Non-text UI (field borders, focus rings) and large display text need 3:1 (WCAG 1.4.11, 1.4.3).
  const ui: Array<[string, string]> = [
    ['field-border', 'limewash'],
    ['field-border', 'paper'],
    ['terracotta', 'limewash'],
    ['terracotta', 'paper'],
    ['sand', 'espresso'],
    ['clay', 'limewash'],
  ];
  it.each(ui)('%s on %s is at least 3:1', (fg, bg) => {
    expect(c(fg, bg)).toBeGreaterThanOrEqual(3);
  });

  // Pairings the brief forbids, kept here so nobody "fixes" the rule away.
  it('terracotta fails on espresso, so it must never be used there', () => {
    expect(c('terracotta', 'espresso')).toBeLessThan(3);
  });
  it('grey-muted fails on stone, so it is limewash-only', () => {
    expect(c('grey-muted', 'stone')).toBeLessThan(4.5);
  });
  it('field-border fails on stone, so fields stay on paper/limewash', () => {
    expect(c('field-border', 'stone')).toBeLessThan(3);
  });
});
