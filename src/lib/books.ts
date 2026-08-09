// Books read, from the Goodreads RSS feed, fetched at build time.
//
// Goodreads' RSS is flaky (rate limits, 5xx, the odd empty shelf), and a bad
// response used to blank the whole page until the next deploy. So every good
// fetch is snapshotted to data/books.json and a bad one falls back to it. That
// file lives on the `puzzle-data` orphan branch alongside the puzzle CSVs —
// same reasoning as there, main's history stays free of the data commits — and
// is checked out into data/ by CI and by `npm run data:pull` locally.
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { XMLParser } from 'fast-xml-parser';
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

const FEED_URL = 'https://www.goodreads.com/review/list_rss/155595600?key=rnunOBA8PnvD5G5X5IHggIpz0VA3sfsiCn9wu_axPoAoOwzW&shelf=read';

interface BookCache {
  fetchedAt: string;
  books: Book[];
}

// Resolved from the project root, not from import.meta.url: Astro bundles this
// module at build time, so a module-relative path would miss the data/
// checkout. Same reasoning as readData() in puzzles.ts.
const CACHE_PATH = join(process.cwd(), 'data', 'books.json');

// Reviews come out of the feed as HTML: paragraph breaks, the odd link, the
// odd blockquote. The tooltip wants one flat line of text, the latest-review
// card wants the markup — so the feed gives us both, and neither is derived
// from the other at render time.
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

function readCache(): Book[] {
  try {
    const cache: BookCache = JSON.parse(readFileSync(CACHE_PATH, 'utf-8'));
    if (!Array.isArray(cache.books) || cache.books.length === 0) return [];
    const ageDays = Math.round((Date.now() - new Date(cache.fetchedAt).getTime()) / 86_400_000);
    console.warn(`Using cached books from data/books.json (${cache.books.length} books, ${ageDays}d old).`);
    // Snapshots written before reviewHtml existed only have the flat text —
    // escape it rather than let the card render `undefined`.
    return cache.books.map((book) => ({
      ...book,
      reviewHtml: book.reviewHtml ?? he.encode(book.review ?? ''),
    }));
  } catch (err) {
    // No data/ checkout (a fresh clone that skipped `npm run data:pull`), or a
    // corrupt file. Nothing better to do than render the page empty.
    console.error('No usable book cache at data/books.json:', err);
    return [];
  }
}

function writeCache(books: Book[]): void {
  try {
    const cache: BookCache = { fetchedAt: new Date().toISOString(), books };
    writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2) + '\n');
  } catch (err) {
    // data/ isn't checked out — the build still has live data, so this is only
    // worth a warning, never a failure.
    console.warn('Could not write data/books.json:', err);
  }
}

export async function getReadBooks(): Promise<Book[]> {
  try {
    const res = await fetch(FEED_URL);
    if (!res.ok) {
      console.error(`Failed to fetch Goodreads RSS: ${res.status} ${res.statusText}`);
      return readCache();
    }
    const xmlData = await res.text();

    const parser = new XMLParser({
      ignoreAttributes: false,
      parseAttributeValue: true,
      trimValues: true,
    });
    const parsed = parser.parse(xmlData);

    let items = parsed?.rss?.channel?.item;
    // An empty shelf is indistinguishable from a soft failure (Goodreads serves
    // a valid-but-bookless feed when it rate-limits), and the read shelf is
    // never legitimately empty — so treat it as a failure and keep the cache.
    if (!items) return readCache();

    // If there's only one item, fast-xml-parser returns an object, not an array.
    if (!Array.isArray(items)) {
      items = [items];
    }

    const books: Book[] = items.map((item: any) => {
      // Clean the image URL to try and get a larger version
      // Usually goodreads image URLs have `_SY75_` or `_SX50_` etc.
      // We can replace that suffix to get the original image.
      let img = item.book_large_image_url || item.book_image_url || '';
      img = img.replace(/\._[A-Z0-9]+_\./g, '._SY475_.');

      const rawReview = String(item.user_review || '');

      let readAt = item.user_read_at || null;
      if (readAt === '') readAt = null;

      return {
        id: item.book_id ? String(item.book_id) : Math.random().toString(36),
        title: item.title,
        author: item.author_name,
        imageUrl: img,
        rating: Number(item.user_rating) || 0,
        review: flattenReview(rawReview),
        reviewHtml: sanitizeReviewHtml(rawReview),
        readAt: readAt ? new Date(readAt).toISOString() : null,
        addedAt: new Date(item.user_date_added || Date.now()).toISOString(),
      };
    }).sort((a: Book, b: Book) => {
      // Sort by readAt desc, then addedAt desc
      const dateA = a.readAt ? new Date(a.readAt).getTime() : new Date(a.addedAt).getTime();
      const dateB = b.readAt ? new Date(b.readAt).getTime() : new Date(b.addedAt).getTime();
      return dateB - dateA;
    });

    writeCache(books);
    return books;

  } catch (err) {
    console.error('Error fetching/parsing books:', err);
    return readCache();
  }
}
