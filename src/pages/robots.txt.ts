/**
 * robots.txt (brief §13): crawling allowed, sitemap referenced. Preview builds (fixtures) ask
 * every crawler to stay out.
 */
import type { APIRoute } from 'astro';
import { IS_PREVIEW_BUILD } from '../lib/preview';

export const GET: APIRoute = ({ site }) => {
  const sitemap = new URL('sitemap-index.xml', site ?? 'http://localhost:4321').href;
  const body = IS_PREVIEW_BUILD
    ? 'User-agent: *\nDisallow: /\n'
    : `User-agent: *\nAllow: /\n\nSitemap: ${sitemap}\n`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
