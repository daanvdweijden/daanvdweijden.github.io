import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// The "news" feed: one Markdown file per announcement in src/content/news/.
// Adding news = adding a file. The schema below just keeps the fields honest.
// See src/content/news/README.md for the field reference and template.
const news = defineCollection({
  // Exclude the README (docs, no frontmatter) and any _-prefixed scratch files.
  loader: glob({
    pattern: ['**/*.md', '!**/README.md', '!**/_*.md'],
    base: './src/content/news',
  }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    tag: z.string().optional(), // e.g. "conference", "publication", "award"
    // Substring of `title` to emphasize when the title is shown in a list
    // (homepage feed, /news index). Must match part of `title` exactly.
    // Ignored on the item's own page, where the title renders plain.
    emphasis: z.string().optional(),
    draft: z.boolean().default(false),
  }),
});

// Publications: one Markdown file per paper in src/content/publications/.
// Frontmatter carries the metadata; the Markdown body IS the abstract shown
// on the paper's own page. See src/content/publications/README.md for the
// full field reference and a copy-paste template.
const publications = defineCollection({
  // Exclude the README (docs, no frontmatter) and any _-prefixed scratch files.
  loader: glob({
    pattern: ['**/*.md', '!**/README.md', '!**/_*.md'],
    base: './src/content/publications',
  }),
  schema: z.object({
    title: z.string(),
    authors: z.array(z.string()), // full names; your own is auto-emphasised
    date: z.coerce.date(), // publication date — the year is derived from this
    venue: z.string(), // full venue name, e.g. "Benelux Conference on AI (BNAIC)"
    venueShort: z.string().optional(), // short badge, e.g. "BNAIC"
    type: z.string().optional(), // e.g. "Conference paper", "Journal article"
    note: z.string().optional(), // e.g. "Master's project", "Best paper"
    // Locally-hosted PDF: the filename of a PDF dropped in public/papers/, e.g.
    // "2024-playing-with-fire.pdf". Renders a "PDF" button linking to the copy on
    // this site, and drives the first-page thumbnail (scripts/build_thumbs.py
    // writes public/papers/thumbs/<stem>.png). Keep links.arxiv/doi/url for the
    // canonical online version.
    file: z.string().optional(),
    // Manual thumbnail override — a path relative to public/, e.g.
    // "papers/thumbs/2024-playing-with-fire.png" or any custom image. When set it
    // is used verbatim and the generator leaves it alone; otherwise the auto
    // thumbnail at papers/thumbs/<file-stem>.png is used when it exists.
    thumb: z.string().optional(),
    // Any subset of these renders as an action button, in this order.
    links: z
      .object({
        pdf: z.string().optional(),
        arxiv: z.string().optional(),
        doi: z.string().optional(), // bare DOI, e.g. "10.1000/xyz"; linked automatically
        code: z.string().optional(),
        slides: z.string().optional(),
        poster: z.string().optional(),
        video: z.string().optional(),
        url: z.string().optional(), // any other canonical link
      })
      .nullish(), // tolerate `links:` left empty (parses as null)
    // Optional raw BibTeX. If omitted, a sensible entry is generated for you.
    bibtex: z.string().optional(),
    featured: z.boolean().default(false),
    draft: z.boolean().default(false),
  }),
});

export const collections = { news, publications };
