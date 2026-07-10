import { XMLParser } from 'fast-xml-parser';
import he from 'he';

export interface Book {
  id: string;
  title: string;
  author: string;
  imageUrl: string;
  rating: number;
  review: string;
  readAt: string | null;
  addedAt: string;
}

const FEED_URL = 'https://www.goodreads.com/review/list_rss/155595600?key=rnunOBA8PnvD5G5X5IHggIpz0VA3sfsiCn9wu_axPoAoOwzW&shelf=read';

export async function getReadBooks(): Promise<Book[]> {
  try {
    const res = await fetch(FEED_URL);
    if (!res.ok) {
      console.error(`Failed to fetch Goodreads RSS: ${res.status} ${res.statusText}`);
      return [];
    }
    const xmlData = await res.text();

    const parser = new XMLParser({
      ignoreAttributes: false,
      parseAttributeValue: true,
      trimValues: true,
    });
    const parsed = parser.parse(xmlData);

    let items = parsed?.rss?.channel?.item;
    if (!items) return [];

    // If there's only one item, fast-xml-parser returns an object, not an array.
    if (!Array.isArray(items)) {
      items = [items];
    }

    return items.map((item: any) => {
      // Clean the image URL to try and get a larger version
      // Usually goodreads image URLs have `_SY75_` or `_SX50_` etc.
      // We can replace that suffix to get the original image.
      let img = item.book_large_image_url || item.book_image_url || '';
      img = img.replace(/\._[A-Z0-9]+_\./g, '._SY475_.');

      // Decode HTML entities in review (Goodreads returns HTML for reviews sometimes)
      const rawReview = item.user_review || '';
      // We can strip HTML tags if we just want plain text, or keep it.
      // Let's strip simple p/br tags for a clean tooltip, or we can render it as HTML.
      // For the tooltip, simple text is better.
      const cleanReview = he.decode(rawReview.replace(/<[^>]+>/g, ' ')).trim();

      let readAt = item.user_read_at || null;
      if (readAt === '') readAt = null;

      return {
        id: item.book_id ? String(item.book_id) : Math.random().toString(36),
        title: item.title,
        author: item.author_name,
        imageUrl: img,
        rating: Number(item.user_rating) || 0,
        review: cleanReview,
        readAt: readAt ? new Date(readAt).toISOString() : null,
        addedAt: new Date(item.user_date_added || Date.now()).toISOString(),
      };
    }).sort((a: Book, b: Book) => {
      // Sort by readAt desc, then addedAt desc
      const dateA = a.readAt ? new Date(a.readAt).getTime() : new Date(a.addedAt).getTime();
      const dateB = b.readAt ? new Date(b.readAt).getTime() : new Date(b.addedAt).getTime();
      return dateB - dateA;
    });

  } catch (err) {
    console.error('Error fetching/parsing books:', err);
    return [];
  }
}
