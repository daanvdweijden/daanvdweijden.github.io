// @ts-check
import { defineConfig } from 'astro/config';

// Minimal config on purpose. We'll add integrations (e.g. an interactive
// island, sitemap, etc.) only when a moodboard element actually needs them.
export default defineConfig({
  // Served at the apex custom domain from the daanvdweijden.github.io user-site repo.
  site: 'https://daanvdweijden.com',
});
