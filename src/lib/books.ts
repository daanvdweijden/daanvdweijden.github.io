// Books read, from data/books.json, written by `npm run books`
// (scripts/import_goodreads.py) from a Goodreads library export.
//
// This used to be a live fetch of the Goodreads RSS feed, but Goodreads switched
// its feeds off in November 2026 and shelf pages now need a login, so the
// export is the only way left to get the data out. books.json lives on the
// `puzzle-data` orphan branch alongside the puzzle CSVs and is checked out into
// data/ by CI and by `npm run data:pull` locally.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import he from 'he';

export interface Book {
  id: string;
  title: string;
  author: string;
  imageUrl: string;
  rating: number;
  /** Flattened to one line, for the hover tooltip. */
  review: string;
  /** Goodreads' own markup, allowlist-sanitized, for the full-width card. */
  reviewHtml: string;
  readAt: string | null;
  addedAt: string;
}

interface BookCache {
  fetchedAt: string;
  books: Book[];
}

// Resolved from the project root, not from import.meta.url: Astro bundles this
// module at build time, so a module-relative path would miss the data/
// checkout. Same reasoning as readData() in puzzles.ts.
const CACHE_PATH = join(process.cwd(), 'data', 'books.json');

// Reviews are HTML: line breaks, the odd link, the odd blockquote. The tooltip
// wants one flat line of text, the latest-review card wants the markup, so both
// are derived here from the stored review. Sanitizing already-sanitized markup
// is a no-op, so older snapshots (written when this sanitized the feed) load
// the same way.
const ALLOWED_TAGS = new Set(['p', 'br', 'em', 'i', 'strong', 'b', 'blockquote', 'ul', 'ol', 'li']);

function sanitizeReviewHtml(raw: string): string {
  return raw
    // Drop comments and anything whose *content* would leak through once its
    // tags are stripped below.
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<(script|style)\b[\s\S]*?<\/\1\s*>/gi, '')
    .replace(/<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/g, (tag, name: string) => {
      const closing = tag.startsWith('</');
      const lower = name.toLowerCase();
      if (lower === 'a') {
        if (closing) return '</a>';
        const href = /\shref\s*=\s*(?:"([^"]*)"|'([^']*)')/i.exec(tag);
        const url = he.decode(href?.[1] ?? href?.[2] ?? '');
        // Anything that isn't a plain http(s) link (javascript:, data:, a bare
        // fragment) loses the anchor but keeps its text.
        if (!/^https?:\/\//i.test(url)) return '';
        return `<a href="${he.encode(url)}" target="_blank" rel="nofollow noopener noreferrer">`;
      }
      // Rebuilt rather than passed through, so every attribute is dropped.
      if (!ALLOWED_TAGS.has(lower)) return '';
      if (lower === 'br') return '<br />';
      return closing ? `</${lower}>` : `<${lower}>`;
    })
    .trim();
}

function flattenReview(raw: string): string {
  // Every tag becomes a space so words either side of a <br /> don't fuse,
  // then the runs that leaves collapse back to single spaces.
  return he.decode(raw.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
}

export async function getReadBooks(): Promise<Book[]> {
  let cache: BookCache;
  try {
    cache = JSON.parse(readFileSync(CACHE_PATH, 'utf-8'));
  } catch (err) {
    // No data/ checkout (a fresh clone that skipped `npm run data:pull`), or a
    // corrupt file. Nothing better to do than render the page empty.
    console.error('No usable books file at data/books.json:', err);
    return [];
  }
  const ageDays = Math.round((Date.now() - new Date(cache.fetchedAt).getTime()) / 86_400_000);
  console.log(`Books from data/books.json (${cache.books?.length ?? 0} books, imported ${ageDays}d ago).`);
  return (cache.books ?? []).map((book) => {
    const raw = book.reviewHtml ?? he.encode(book.review ?? '');
    return { ...book, review: flattenReview(raw), reviewHtml: sanitizeReviewHtml(raw) };
  });
}
