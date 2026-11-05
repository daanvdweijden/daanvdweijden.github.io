// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Pages marked `noindex` in their <Layout> (the footer easter eggs) are kept
// out of the sitemap too, so crawlers get one consistent signal.
const NOINDEX = ['/puzzles/', '/books/', '/music/'];

// Optional sub-path build, e.g. SITE_BASE=/preview/ for a design preview
// published next to the live site. Unset = root.
const BASE = process.env.SITE_BASE || '/';

// Markdown content links and images are written root-relative (/pubs/…,
// /news/…). After a sub-path build, prefix any such URL in the generated HTML
// so the preview stays inside its own path. No-op for the normal root build.
const prefixRootLinks = {
  name: 'prefix-root-links',
  hooks: {
    'astro:build:done': async ({ dir }) => {
      if (BASE === '/') return;
      const { readdir, readFile, writeFile } = await import('node:fs/promises');
      const { join } = await import('node:path');
      const { fileURLToPath } = await import('node:url');
      const prefix = BASE.replace(/\/$/, '');
      const walk = async (d) => {
        for (const e of await readdir(d, { withFileTypes: true })) {
          const p = join(d, e.name);
          if (e.isDirectory()) await walk(p);
          else if (e.name.endsWith('.html')) {
            const html = await readFile(p, 'utf8');
            const out = html.replace(/(href|src)="(\/(?!\/)[^"]*)"/g, (m, a, u) =>
              u === prefix || u.startsWith(prefix + '/') ? m : `${a}="${prefix}${u}"`);
            if (out !== html) await writeFile(p, out);
          }
        }
      };
      await walk(fileURLToPath(dir));
    },
  },
};

export default defineConfig({
  // Served at the apex custom domain from the daanvdweijden.github.io user-site repo.
  site: 'https://daanvdweijden.com',
  base: BASE,
  integrations: [
    prefixRootLinks,
    sitemap({
      filter: (page) => !NOINDEX.some((p) => new URL(page).pathname.startsWith(p)),
    }),
  ],
});
