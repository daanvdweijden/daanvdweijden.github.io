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

export interface Artist {
  id: number;
  name: string;
  imageUrl: string;
  streams: number;
  playedMs: number;
  position: number;
  spotifyId: string | null;
}

export interface Track {
  id: number;
  name: string;
  artist: string;
  imageUrl: string;
  streams: number;
  playedMs: number;
  position: number;
  spotifyId: string | null;
}

export interface MusicStats {
  /** Listening time over the requested window, in milliseconds. */
  durationMs: number;
  /** Total number of streams (plays over 30s). */
  streams: number;
  uniqueTracks: number;
  uniqueArtists: number;
  uniqueAlbums: number;
}

export interface MusicData {
  albums: Album[];
  recentAlbums: Album[];
  topArtists30d: Artist[];
  topTracks30d: Track[];
  topAlbums30d: Album[];
  stats: MusicStats | null;
  stats30d: MusicStats | null;
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

function mapAlbum(item: any): Album {
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
}

function mapArtist(item: any): Artist {
  const a = item.artist ?? {};
  const spotifyId = Array.isArray(a.externalIds?.spotify) ? a.externalIds.spotify[0] ?? null : null;

  return {
    id: a.id,
    name: a.name ?? 'Unknown artist',
    imageUrl: a.image ?? '',
    streams: Number(item.streams) || 0,
    playedMs: Number(item.playedMs) || 0,
    position: Number(item.position) || 0,
    spotifyId,
  };
}

function mapTrack(item: any): Track {
  const t = item.track ?? {};
  const artists = Array.isArray(t.artists) ? t.artists : [];
  const spotifyId = Array.isArray(t.externalIds?.spotify) ? t.externalIds.spotify[0] ?? null : null;

  return {
    id: t.id,
    name: t.name ?? 'Unknown track',
    artist: artists.map((ar: any) => ar.name).join(', ') || 'Unknown artist',
    imageUrl: t.albums?.[0]?.image ?? '',
    streams: Number(item.streams) || 0,
    playedMs: Number(item.playedMs) || 0,
    position: Number(item.position) || 0,
    spotifyId,
  };
}

/** Builds the `range=` or `after=` query fragment. `after` takes a lookback window in days. */
function rangeQuery({ range, afterDays }: { range?: string; afterDays?: number }): string {
  if (afterDays) {
    const after = Date.now() - afterDays * 24 * 60 * 60 * 1000;
    return `after=${after}`;
  }
  return `range=${range ?? 'lifetime'}`;
}

// stats.fm's API returns fewer items than requested (e.g. limit=12 -> 11 items,
// limit=48 -> 46), with the shortfall growing with the requested size. Over-fetch
// by 1 and slice down to compensate.

// stats.fm only ranks albums by stream count, but a quick skip-back-to-the-start
// habit (looking at you, Aida) can rack up plays without much actual listening time.
// Hours listened is the more honest "favorite" signal, so we over-fetch a wide pool
// ranked by streams and re-rank it locally by playedMs.
export async function getTopAlbums(opts: { limit?: number; range?: string; afterDays?: number } = {}): Promise<Album[]> {
  const { limit = 48 } = opts;
  const poolSize = Math.max(limit * 5, 60);
  const data = await fetchJson(`/users/${USER}/top/albums?${rangeQuery(opts)}&limit=${poolSize + 1}`);
  const items = data?.items;
  if (!Array.isArray(items)) return [];
  const albums = items.slice(0, poolSize).map(mapAlbum);
  albums.sort((a, b) => b.playedMs - a.playedMs);
  return albums.slice(0, limit).map((album, i) => ({ ...album, position: i + 1 }));
}

export async function getTopArtists(opts: { limit?: number; range?: string; afterDays?: number } = {}): Promise<Artist[]> {
  const { limit = 10 } = opts;
  const data = await fetchJson(`/users/${USER}/top/artists?${rangeQuery(opts)}&limit=${limit + 1}`);
  const items = data?.items;
  if (!Array.isArray(items)) return [];
  return items.slice(0, limit).map(mapArtist);
}

export async function getTopTracks(opts: { limit?: number; range?: string; afterDays?: number } = {}): Promise<Track[]> {
  const { limit = 10 } = opts;
  const data = await fetchJson(`/users/${USER}/top/tracks?${rangeQuery(opts)}&limit=${limit + 1}`);
  const items = data?.items;
  if (!Array.isArray(items)) return [];
  return items.slice(0, limit).map(mapTrack);
}

export async function getMusicStats(opts: { range?: string; afterDays?: number } = {}): Promise<MusicStats | null> {
  const data = await fetchJson(`/users/${USER}/streams/stats?${rangeQuery(opts)}`);
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
  const [albums, recentAlbums, topAlbums30d, topArtists30d, topTracks30d, stats, stats30d] = await Promise.all([
    getTopAlbums({ limit: 12 }),
    getTopAlbums({ limit: 6, afterDays: 365 }),
    getTopAlbums({ limit: 10, afterDays: 30 }),
    getTopArtists({ limit: 15, afterDays: 30 }),
    getTopTracks({ limit: 10, afterDays: 30 }),
    getMusicStats(),
    getMusicStats({ afterDays: 30 }),
  ]);
  return { albums, recentAlbums, topArtists30d, topTracks30d, topAlbums30d, stats, stats30d };
}
