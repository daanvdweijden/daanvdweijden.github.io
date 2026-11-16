// Album and book covers come from Apple Music, Spotify and Goodreads, at
// whatever size those hosts serve (up to ~190 kB each). At build time we fetch
// each one, shrink it to the size the page shows and serve it from this site,
// so a visit makes no requests to those hosts. If a cover can't be fetched,
// the page keeps its remote URL rather than failing the build.
import { getImage } from 'astro:assets';

export async function localCover(url: string, width: number): Promise<string> {
  if (!url) return url;
  try {
    const img = await getImage({ src: url, inferSize: true, width, format: 'webp', quality: 78 });
    return img.src;
  } catch (e) {
    console.warn(`[covers] kept remote ${url}: ${e}`);
    return url;
  }
}

/** The same list with every `imageUrl` made local. */
export const withLocalCovers = <T extends { imageUrl: string }>(items: T[], width: number) =>
  Promise.all(items.map(async (item) => ({ ...item, imageUrl: await localCover(item.imageUrl, width) })));
