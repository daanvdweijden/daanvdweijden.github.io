// ---------------------------------------------------------------------------
// Helpers for the `publications` content collection. Each paper is a Markdown
// file (see src/content/publications/); these functions load, sort, group and
// format them for the list page, the per-paper page, and the home page.
// ---------------------------------------------------------------------------
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { getCollection, type CollectionEntry } from 'astro:content';
import { site } from '../site.config';

export type Pub = CollectionEntry<'publications'>;

// Absolute path to the project's public/ folder, so we can check at build time
// whether an auto-generated thumbnail actually exists on disk.
const PUBLIC_DIR = fileURLToPath(new URL('../../public/', import.meta.url));

/** "2024-foo" from "2024-foo.pdf". */
const fileStem = (file: string) => file.replace(/\.pdf$/i, '');

/** All non-draft publications, newest first. */
export async function getPublications(): Promise<Pub[]> {
  const pubs = await getCollection('publications', ({ data }) => !data.draft);
  return pubs.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

export const yearOf = (p: Pub) => p.data.date.getFullYear();

/** Groups publications by year, descending. */
export function groupByYear(pubs: Pub[]): { year: number; items: Pub[] }[] {
  const groups = new Map<number, Pub[]>();
  for (const p of pubs) {
    const y = yearOf(p);
    if (!groups.has(y)) groups.set(y, []);
    groups.get(y)!.push(p);
  }
  return [...groups.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([year, items]) => ({ year, items }));
}

/** True when the name is the site owner (so we can emphasise it). */
export const isOwner = (name: string) => name === site.name;

/** URL to the PDF hosted on this site (public/papers/), or null if none. */
export function localPdfHref(p: Pub): string | null {
  return p.data.file ? `${import.meta.env.BASE_URL}papers/${p.data.file}` : null;
}

/**
 * First-page thumbnail for the paper, or null when there is none.
 * Priority: explicit `thumb` override → auto thumbnail at
 * papers/thumbs/<file-stem>.jpg (only if that file exists on disk) → null.
 */
export function thumbSrc(p: Pub): string | null {
  const base = import.meta.env.BASE_URL;
  if (p.data.thumb) return `${base}${p.data.thumb.replace(/^\/+/, '')}`;
  if (!p.data.file) return null;
  const rel = `papers/thumbs/${fileStem(p.data.file)}.jpg`;
  return existsSync(PUBLIC_DIR + rel) ? `${base}${rel}` : null;
}

/** Normalises the optional links object into an ordered list of buttons. */
export function actionLinks(p: Pub): { label: string; href: string }[] {
  const l = p.data.links ?? {};
  const out: { label: string; href: string }[] = [];
  const local = localPdfHref(p);
  // The copy hosted here comes first; if an external PDF link also exists it is
  // relabelled so the two "PDF" buttons don't collide.
  if (local) out.push({ label: 'PDF', href: local });
  if (l.pdf) out.push({ label: local ? 'PDF (source)' : 'PDF', href: l.pdf });
  if (l.arxiv) out.push({ label: 'arXiv', href: l.arxiv });
  if (l.doi) out.push({ label: 'DOI', href: `https://doi.org/${l.doi}` });
  if (l.code) out.push({ label: 'Code', href: l.code });
  if (l.slides) out.push({ label: 'Slides', href: l.slides });
  if (l.poster) out.push({ label: 'Poster', href: l.poster });
  if (l.video) out.push({ label: 'Video', href: l.video });
  if (l.url) out.push({ label: 'Link', href: l.url });
  return out;
}

/** Path to a paper's own page. */
export const pubHref = (p: Pub) => `${import.meta.env.BASE_URL}pubs/${p.id}/`;

/**
 * Returns the paper's BibTeX: the `bibtex` frontmatter verbatim if present,
 * otherwise a reasonable @inproceedings entry generated from the metadata.
 */
export function bibtexFor(p: Pub): string {
  if (p.data.bibtex) return p.data.bibtex.trim();

  const key = p.id.replace(/[^\w-]/g, '');
  const lines = [
    `@inproceedings{${key},`,
    `  title     = {${p.data.title}},`,
    `  author    = {${p.data.authors.join(' and ')}},`,
    `  booktitle = {${p.data.venue}},`,
    `  year      = {${yearOf(p)}},`,
  ];
  if (p.data.links?.doi) lines.push(`  doi       = {${p.data.links.doi}},`);
  const note = [p.data.note, p.data.award].filter(Boolean).join(', ');
  if (note) lines.push(`  note      = {${note}},`);
  lines.push('}');
  return lines.join('\n');
}
