// @ts-check
import { defineConfig, envField, fontProviders } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import sitemap from '@astrojs/sitemap';
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
        injectRoute({ pattern: '/dev/layout', entrypoint: './src/dev/layout.astro' });
      },
    },
  };
}

export default defineConfig({
  site,
  // Every page is prerendered except /enquire, which handles the enquiry POST on Cloudflare.
  output: 'static',
  adapter: cloudflare({
    // Images are optimised at build time with Sharp; pages prerender in Node.
    imageService: 'compile',
    prerenderEnvironment: 'node',
  }),
  env: {
    schema: {
      /** Build-time switch: link to /enquire only once the accounts below are live [V25]. */
      PUBLIC_ENQUIRY_ENABLED: envField.boolean({
        context: 'client',
        access: 'public',
        default: false,
      }),
      /** Cookieless analytics [V25]: none until a provider is chosen. */
      PUBLIC_ANALYTICS_PROVIDER: envField.enum({
        context: 'client',
        access: 'public',
        values: ['none', 'plausible', 'cloudflare'],
        default: 'none',
      }),
      PUBLIC_ANALYTICS_DOMAIN: envField.string({
        context: 'client',
        access: 'public',
        optional: true,
      }),
      PUBLIC_CF_ANALYTICS_TOKEN: envField.string({
        context: 'client',
        access: 'public',
        optional: true,
      }),
      PUBLIC_TURNSTILE_SITE_KEY: envField.string({
        context: 'client',
        access: 'public',
        optional: true,
      }),
      TURNSTILE_SECRET_KEY: envField.string({
        context: 'server',
        access: 'secret',
        optional: true,
      }),
      RESEND_API_KEY: envField.string({ context: 'server', access: 'secret', optional: true }),
      ENQUIRY_TO_EMAIL: envField.string({ context: 'server', access: 'secret', optional: true }),
      ENQUIRY_FROM_EMAIL: envField.string({ context: 'server', access: 'secret', optional: true }),
      LEAD_STORE: envField.enum({
        context: 'server',
        access: 'secret',
        values: ['sheets', 'crm', 'none'],
        default: 'none',
      }),
      GOOGLE_SHEETS_ID: envField.string({ context: 'server', access: 'secret', optional: true }),
      GOOGLE_SA_EMAIL: envField.string({ context: 'server', access: 'secret', optional: true }),
      GOOGLE_SA_PRIVATE_KEY: envField.string({
        context: 'server',
        access: 'secret',
        optional: true,
      }),
      CRM_WEBHOOK_URL: envField.string({ context: 'server', access: 'secret', optional: true }),
      PRIVACY_NOTICE_VERSION: envField.string({
        context: 'server',
        access: 'public',
        default: 'draft',
      }),
      /** Development only: skip external services and log enquiries to the console. */
      ENQUIRY_MOCK: envField.boolean({ context: 'server', access: 'public', default: false }),
    },
  },
  integrations: [
    devOnlyRoutes(),
    sitemap({
      // Pages that are noindex never appear in the sitemap.
      // /enquire is listed only once the form is switched on (it answers 404 until then).
      filter: (page) =>
        !/\/(404|enquire\/thank-you)(\.html)?\/?$/.test(page) &&
        (process.env.PUBLIC_ENQUIRY_ENABLED === 'true' || !/\/enquire\/?$/.test(page)),
    }),
  ],
  // The dev toolbar adds its own controls (including a "Menu" button); keep it out of e2e runs.
  devToolbar: { enabled: process.env.E2E !== '1' },
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
