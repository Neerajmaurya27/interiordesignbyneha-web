// @ts-check
import { defineConfig, fontProviders } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// The production domain is not confirmed yet [V18]; set SITE_URL in the environment.
const site = process.env.SITE_URL ?? 'http://localhost:4321';

/** Registers design-system reference pages during `astro dev` only. */
function devOnlyRoutes() {
  return {
    name: 'dev-only-routes',
    hooks: {
      /** @param {{ command: string, injectRoute: (route: { pattern: string, entrypoint: string }) => void }} options */
      'astro:config:setup': ({ command, injectRoute }) => {
        if (command !== 'dev') return;
        injectRoute({ pattern: '/dev/tokens', entrypoint: './src/dev/tokens.astro' });
      },
    },
  };
}

export default defineConfig({
  site,
  output: 'static',
  integrations: [devOnlyRoutes()],
  trailingSlash: 'never',
  build: { format: 'file' },
  fonts: [
    {
      // Fraunces "full" axes file (opsz, wght, SOFT, WONK): the display style needs SOFT.
      provider: fontProviders.local(),
      name: 'Fraunces',
      cssVariable: '--font-fraunces',
      fallbacks: ['Georgia', 'serif'],
      options: {
        variants: [
          {
            src: ['@fontsource-variable/fraunces/files/fraunces-latin-full-normal.woff2'],
            weight: '100 900',
            style: 'normal',
            display: 'swap',
          },
        ],
      },
    },
    {
      provider: fontProviders.local(),
      name: 'Inter',
      cssVariable: '--font-inter',
      fallbacks: ['Arial', 'sans-serif'],
      options: {
        variants: [
          {
            src: ['@fontsource-variable/inter/files/inter-latin-opsz-normal.woff2'],
            weight: '100 900',
            style: 'normal',
            display: 'swap',
          },
        ],
      },
    },
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
