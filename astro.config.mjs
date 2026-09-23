// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Pages marked `noindex` in their <Layout> (the footer easter eggs) are kept
// out of the sitemap too, so crawlers get one consistent signal.
const NOINDEX = ['/puzzles/', '/books/', '/music/'];

export default defineConfig({
  // Served at the apex custom domain from the daanvdweijden.github.io user-site repo.
  site: 'https://daanvdweijden.com',
  integrations: [
    sitemap({
      filter: (page) => !NOINDEX.some((p) => new URL(page).pathname.startsWith(p)),
    }),
  ],
});
