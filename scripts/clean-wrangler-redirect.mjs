#!/usr/bin/env node
/**
 * `astro build` with the Cloudflare adapter writes .wrangler/deploy/config.json, which points
 * wrangler at the built Worker. A dev server started afterwards would then render with the stale
 * production build. Removing the redirect before `astro dev` keeps development on source files.
 */
import { rmSync } from 'node:fs';

rmSync(new URL('../.wrangler/deploy', import.meta.url), { recursive: true, force: true });
