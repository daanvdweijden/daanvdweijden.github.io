// Music data pulled from the (undocumented but public) stats.fm API at build time,
// mirroring the Goodreads approach in ./books.ts. stats.fm sits on top of my full
// imported Spotify history, so `range=lifetime` reflects everything I've ever played.
// Gated only by my per-category privacy toggles — no API key or OAuth needed.

const USER = 'daanvdw';
const API = 'https://api.stats.fm/api/v1';

export interface Album {
  id: number;
  name: string;
  artist: string;
  imageUrl: string;
  label: string;
  releaseYear: number | null;
  streams: number;
  /** Total time spent on this album, in milliseconds. */
  playedMs: number;
  position: number;
  spotifyId: string | null;
}

export interface MusicStats {
  /** Lifetime listening time in milliseconds. */
  durationMs: number;
  /** Total number of streams (plays over 30s). */
  streams: number;
  uniqueTracks: number;
  uniqueArtists: number;
  uniqueAlbums: number;
}

export interface MusicData {
  albums: Album[];
  stats: MusicStats | null;
}

async function fetchJson(path: string): Promise<any | null> {
  try {
    const res = await fetch(`${API}${path}`);
    if (!res.ok) {
      console.error(`stats.fm ${path} -> ${res.status} ${res.statusText}`);
      return null;
    }
    return await res.json();
  } catch (err) {
    console.error(`Error fetching stats.fm ${path}:`, err);
    return null;
  }
}

export async function getTopAlbums(limit = 48): Promise<Album[]> {
  const data = await fetchJson(`/users/${USER}/top/albums?range=lifetime&limit=${limit}`);
  const items = data?.items;
  if (!Array.isArray(items)) return [];

  return items.map((item: any): Album => {
    const a = item.album ?? {};
    const artists = Array.isArray(a.artists) ? a.artists : [];
    const releaseYear = a.releaseDate ? new Date(a.releaseDate).getFullYear() : null;
    const spotifyId = Array.isArray(a.externalIds?.spotify) ? a.externalIds.spotify[0] ?? null : null;

    return {
      id: a.id,
      name: a.name ?? 'Unknown album',
      artist: artists.map((ar: any) => ar.name).join(', ') || 'Unknown artist',
      imageUrl: a.image ?? '',
      label: a.label ?? '',
      releaseYear,
      streams: Number(item.streams) || 0,
      playedMs: Number(item.playedMs) || 0,
      position: Number(item.position) || 0,
      spotifyId,
    };
  });
}

export async function getMusicStats(): Promise<MusicStats | null> {
  const data = await fetchJson(`/users/${USER}/streams/stats?range=lifetime`);
  const s = data?.items;
  if (!s) return null;

  return {
    durationMs: Number(s.durationMs) || 0,
    streams: Number(s.count) || 0,
    uniqueTracks: Number(s.cardinality?.tracks) || 0,
    uniqueArtists: Number(s.cardinality?.artists) || 0,
    uniqueAlbums: Number(s.cardinality?.albums) || 0,
  };
}

export async function getMusicData(): Promise<MusicData> {
  const [albums, stats] = await Promise.all([getTopAlbums(), getMusicStats()]);
  return { albums, stats };
}
