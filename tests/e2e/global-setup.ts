/**
 * Warm the dev server before the suite runs. The first request to each route can make Vite
 * re-optimise server dependencies (Workers runtime) and show a transient error overlay, and a
 * component's script module can fail to resolve until that component has been compiled. Requesting
 * every route and the script modules it loads, twice over, settles that so tests see a stable server.
 */
const ROUTES = [
  '/',
  '/projects',
  '/projects/fixture-a',
  '/projects/fixture-b',
  '/approach',
  '/studio',
  '/enquire',
  '/enquire/thank-you',
  '/privacy',
  '/dev/layout',
  '/missing-page',
];

export default async function globalSetup() {
  const base = 'http://localhost:4321';
  for (let round = 0; round < 2; round++) {
    for (const route of ROUTES) {
      try {
        const html = await (await fetch(base + route)).text();
        for (const [, src] of html.matchAll(/<script[^>]+type="module"[^>]+src="([^"]+)"/g)) {
          await fetch(new URL(src!, base));
        }
      } catch {
        // The server may restart while optimising; the second round covers it.
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 1500));
  }
}
