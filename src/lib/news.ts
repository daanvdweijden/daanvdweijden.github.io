// ---------------------------------------------------------------------------
// Helpers for the `news` content collection. Each item is a Markdown file
// (see src/content/news/); these functions load, sort, group, and link them
// for the list page, the per-item page, and the home page feed.
// ---------------------------------------------------------------------------
import { getCollection, type CollectionEntry } from 'astro:content';

export type NewsItem = CollectionEntry<'news'>;

/** All non-draft news items, newest first. */
export async function getNews(): Promise<NewsItem[]> {
  const items = await getCollection('news', ({ data }) => !data.draft);
  return items.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

export const yearOf = (n: NewsItem) => n.data.date.getFullYear();

/** Groups news items by year, descending. */
export function groupByYear(items: NewsItem[]): { year: number; items: NewsItem[] }[] {
  const groups = new Map<number, NewsItem[]>();
  for (const n of items) {
    const y = yearOf(n);
    if (!groups.has(y)) groups.set(y, []);
    groups.get(y)!.push(n);
  }
  return [...groups.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([year, items]) => ({ year, items }));
}

/** Path to a news item's own page. */
export const newsHref = (n: NewsItem) => `${import.meta.env.BASE_URL}news/${n.id}/`;
