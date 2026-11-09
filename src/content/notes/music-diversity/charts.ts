// Charts for "How diverse is my Spotify?". Data comes from the workshop
// (~/Documents/Personal/blog/music_diversity/build_post_data.py).
// House style: everything grey, the point in accent (terracotta), a contrast in
// accent2 (sage). Labels in sentence case, names as written, like the text.
import * as Plot from '@observablehq/plot';
import { feature } from 'topojson-client';
import { geoBounds, geoCentroid, geoContains, geoEqualEarth } from 'd3-geo';
import world from 'world-atlas/countries-110m.json';
import { base, type ChartFn, type ChartContext } from '../../../lib/chart';

const narrow = (ctx: ChartContext) => ctx.width < 560;
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const yearAxis = (ctx: ChartContext) => ({ label: null, tickFormat: 'd', ticks: narrow(ctx) ? [2016, 2020, 2024] : 6 });
const pctAxis = { label: null, percent: true, ticks: 5, tickFormat: (v: number) => `${v}%` };

/** Middle of each stacked layer at one x, for labels (stacking a filtered subset
 *  with stackY would only stack the labels themselves). */
function mids<T extends Record<string, any>>(rows: T[], key: string, order: string[], keep: (k: string) => boolean) {
  let acc = 0;
  return order.flatMap((k) => {
    const r = rows.find((d) => d[key] === k);
    const v = r ? r.share : 0;
    const out = keep(k) && r ? [{ ...r, y: acc + v / 2 }] : [];
    acc += v;
    return out;
  });
}

// ---------------------------------------------------------------------------
type Source = { quarter: string; total: number; album: number; playlist: number; liked: number; artist: number; unknown: number };

/** Where plays started, per quarter. Albums terracotta, playlists sage. */
export const sources: ChartFn<Source[]> = (data, ctx) => {
  const keys = ['album', 'playlist', 'liked songs', 'other'];
  const fill = [ctx.colors.accent, ctx.colors.accent2, ctx.colors.muted, ctx.colors.faint];
  const long = data.flatMap((q) => [
    { quarter: q.quarter, source: 'album', share: q.album, total: q.total },
    { quarter: q.quarter, source: 'playlist', share: q.playlist, total: q.total },
    { quarter: q.quarter, source: 'liked songs', share: q.liked, total: q.total },
    { quarter: q.quarter, source: 'other', share: q.artist + q.unknown, total: q.total },
  ]);
  const last = data[data.length - 1].quarter;
  const right = narrow(ctx) ? 78 : 96;
  const band = ((ctx.width - 44 - right) / data.length) * 0.8;
  const stack = { x: 'quarter', y: 'share', z: 'source', order: keys };
  return Plot.plot({
    ...base(ctx, 300),
    marginRight: right,
    marginBottom: 36,
    // Year under Q1 (and under the first bar). Phones only have room for those.
    x: {
      label: null, padding: 0.2,
      tickFormat: (q: string) => {
        const yearStart = q.endsWith('Q1') || q === data[0].quarter;
        if (narrow(ctx)) return yearStart ? `${q.slice(5)}\n’${q.slice(2, 4)}` : '';
        return yearStart ? q.replace(' ', '\n') : q.slice(5);
      },
    },
    y: pctAxis,
    color: { domain: keys, range: fill },
    marks: [
      Plot.barY(long, { ...stack, fill: 'source', inset: 0.5 }),
      Plot.text(long.filter((d) => d.quarter === last), Plot.stackY({
        ...stack, text: (d: any) => cap(d.source), textAnchor: 'start', dx: band / 2 + 6, fill: ctx.colors.ink,
      })),
    ],
  });
};

// ---------------------------------------------------------------------------
type PlaylistGroup = { group: string; plays: number; n: number; spotify: boolean; top: string[] };

/** Playlist plays since April 2024, by kind of playlist. Made by Spotify in sage. */
export const playlists: ChartFn<PlaylistGroup[]> = (data, ctx) => {
  const n = narrow(ctx);
  const max = Math.max(...data.map((d) => d.plays));
  const ex = (d: PlaylistGroup) => d.top.slice(0, 2).map((t) => t.replace(/ \(\d+\)$/, '')).filter((t) => t !== '?').join(', ');
  return Plot.plot({
    ...base(ctx, data.length * 38 + 20),
    marginLeft: n ? 150 : 230,
    marginRight: 10,
    x: { axis: null, domain: [0, n ? max * 1.25 : max * 2.3] },
    y: { label: null, domain: data.map((d) => d.group), padding: 0.25, tickSize: 0, tickFormat: cap },
    marks: [
      Plot.barX(data, { y: 'group', x: 'plays', fill: (d: PlaylistGroup) => (d.spotify ? ctx.colors.accent2 : d.group.startsWith('named') ? ctx.colors.accent : ctx.colors.faint), rx: 2 }),
      Plot.text(data, { y: 'group', x: 'plays', text: (d: PlaylistGroup) => (n || !ex(d) ? `${d.plays.toLocaleString()}` : `${d.plays.toLocaleString()} · ${ex(d)}`), dx: 6, textAnchor: 'start', fill: ctx.colors.muted }),
    ],
  });
};

// ---------------------------------------------------------------------------
type ListRow = { year: number; list: 'tunes' | 'old' | 'liked' | 'album' | 'none'; share: number };

/** Every play, per year: in tunes, in my other old playlists, in my likes; the rest split into
 *  full albums (3+ songs in a row from one album) and everything else. */
export const lists: ChartFn<ListRow[]> = (data, ctx) => {
  const order = ['tunes', 'old', 'liked', 'album', 'none'];
  const n = narrow(ctx);
  const name: Record<string, string> = n
    ? { tunes: 'Tunes', old: 'Old playlists', liked: 'Liked', album: 'Full albums', none: 'Everything else' }
    : { tunes: 'Tunes', old: 'My other old playlists', liked: 'Liked songs', album: 'Full albums', none: 'Everything else' };
  const fill: Record<string, string> = { tunes: ctx.colors.accent, old: ctx.colors.muted, liked: ctx.colors.accent2, album: ctx.colors.extra[0], none: ctx.colors.faint };
  const labelAt: Record<string, number> = n
    ? { tunes: 2017, old: 2018, liked: 2023, album: 2021, none: 2023 }
    : { tunes: 2016, old: 2019, liked: 2024, album: 2021, none: 2023 };
  const stack = { x: 'year', y: 'share', z: 'list', order };
  return Plot.plot({
    ...base(ctx, 320),
    x: yearAxis(ctx),
    y: pctAxis,
    marks: [
      Plot.areaY(data, { ...stack, fill: (d: ListRow) => fill[d.list], stroke: ctx.colors.bg, strokeWidth: 1.5, curve: 'monotone-x' }),
      // Label positions: the middle of each layer in its label year (stacked by hand,
      // since stackY on a filtered subset would only stack the labels).
      Plot.text(order.map((k) => {
        const yr = labelAt[k];
        const row = data.filter((d) => d.year === yr);
        const below = order.slice(0, order.indexOf(k)).reduce((s, o) => s + (row.find((d) => d.list === o)?.share ?? 0), 0);
        return { list: k, year: yr, y: below + (row.find((d) => d.list === k)?.share ?? 0) / 2 };
      }), {
        x: 'year', y: 'y', text: (d: any) => name[d.list], fill: (d: any) => (d.list === 'none' ? ctx.colors.ink : ctx.colors.bg), fontWeight: 600,
      }),
    ],
  });
};

// ---------------------------------------------------------------------------
type Genre = { year: number; genre: string; share: number };

/** Genre mix per year (scrolly). 0: hip-hop · 1: the 2020 drop · 2: indie fills in · 3: everything. */
export const genres: ChartFn<Genre[]> = (data, ctx) => {
  const order = ['Hip-hop', 'Indie & alternative', 'Electronic', 'R&B & soul', 'Rock & metal', 'Everything else'];
  const hue: Record<string, string> = {
    'Hip-hop': ctx.colors.accent, 'Indie & alternative': ctx.colors.accent2, Electronic: ctx.colors.extra[0],
    'R&B & soul': ctx.colors.extra[1], 'Rock & metal': ctx.colors.extra[2], 'Everything else': ctx.colors.faint,
  };
  const on = [['Hip-hop'], ['Hip-hop'], ['Hip-hop', 'Indie & alternative'], order][ctx.step] ?? order;
  const fill = (d: Genre) => (on.includes(d.genre) ? hue[d.genre] : ctx.colors.faint);
  const lastYear = Math.max(...data.map((d) => d.year));
  const stack = { x: 'year', y: 'share', z: 'genre', order };
  const label = (g: string) => (narrow(ctx) && g === 'Indie & alternative' ? 'Indie' : g);
  return Plot.plot({
    ...base(ctx, 340),
    marginRight: narrow(ctx) ? 84 : 130,
    x: yearAxis(ctx),
    y: pctAxis,
    marks: [
      Plot.areaY(data, { ...stack, fill, stroke: ctx.colors.bg, strokeWidth: 1.5, curve: 'monotone-x' }),
      ctx.step === 1 ? Plot.ruleX([2020], { stroke: ctx.colors.ink, strokeDasharray: '3,3' }) : null,
      ctx.step === 1 ? Plot.text([2020], { x: (d: number) => d, frameAnchor: 'top', dy: -10, text: () => '2020', fill: ctx.colors.ink }) : null,
      Plot.text(mids(data.filter((d) => d.year === lastYear), 'genre', order, (g) => on.includes(g) || ctx.step === 3), {
        x: 'year', y: 'y', text: (d: Genre) => label(d.genre), textAnchor: 'start', dx: 8, fill: ctx.colors.ink,
      }),
    ],
  });
};

// ---------------------------------------------------------------------------
type Who = { year: number; who: string; share: number };

/** Who made the music, per year: the full split. Women in terracotta, mixed groups sage, men grey. */
export const who: ChartFn<Who[]> = (data, ctx) => {
  const order = ['solo woman', 'women-only group', 'solo non-binary', 'mixed group', 'men-only group', 'solo man'];
  const fill: Record<string, string> = {
    'solo woman': ctx.colors.accent, 'women-only group': ctx.colors.accent, 'solo non-binary': ctx.colors.extra[1],
    'mixed group': ctx.colors.accent2, 'men-only group': ctx.colors.muted, 'solo man': ctx.colors.faint,
  };
  const labelled = new Set(['solo woman', 'mixed group', 'men-only group', 'solo man']);
  const lastYear = Math.max(...data.map((d) => d.year));
  const right = narrow(ctx) ? 108 : 124;
  const band = ((ctx.width - 44 - right) / 11) * 0.85;
  const stack = { x: 'year', y: 'share', z: 'who', order };
  return Plot.plot({
    ...base(ctx, 320),
    marginRight: right,
    // Phones: every other year, or the labels run into each other.
    x: {
      label: null, type: 'band', padding: 0.15,
      ticks: narrow(ctx) ? [...new Set(data.map((d) => d.year))].filter((y) => (lastYear - y) % 2 === 0) : undefined,
      tickFormat: (y: number) => (narrow(ctx) ? `’${String(y).slice(2)}` : String(y)),
    },
    y: pctAxis,
    marks: [
      Plot.barY(data, { ...stack, fill: (d: Who) => fill[d.who], fillOpacity: (d: Who) => (d.who === 'women-only group' ? 0.6 : 1), inset: 0.5 }),
      Plot.text(mids(data.filter((d) => d.year === lastYear), 'who', order, (w) => labelled.has(w)), {
        x: 'year', y: 'y', text: (d: Who) => cap(d.who), textAnchor: 'start', dx: band / 2 + 6, fill: ctx.colors.ink,
      }),
    ],
  });
};

// ---------------------------------------------------------------------------
type Top = { rank: number; artist: string; plays: number; who: string };
const CLASSICAL = new Set(['Frédéric Chopin', 'Brigitte Engerer', 'Giuseppe Verdi', 'Plácido Domingo', 'Samuel Ramey',
  'Metropolitan Opera Orchestra', 'James Levine', 'Aprile Millo', 'Dolora Zajick', 'James Morris']);

/** All-time top 50. Women and mixed groups in terracotta, classical credits faded. */
export const topArtists: ChartFn<Top[]> = (data, ctx) => {
  const label = (d: Top) => `${d.rank}. ${d.artist}`;
  const isWoman = (d: Top) => !CLASSICAL.has(d.artist) && /woman|mixed/.test(d.who);
  const fill = (d: Top) => (isWoman(d) ? ctx.colors.accent : CLASSICAL.has(d.artist) ? ctx.colors.line : ctx.colors.faint);
  return Plot.plot({
    ...base(ctx, data.length * 17 + 30),
    marginLeft: narrow(ctx) ? 150 : 190,
    marginRight: 44,
    x: { label: null, axis: 'top', grid: true, ticks: 4 },
    y: { label: null, domain: data.map(label), padding: 0.18, tickSize: 0 },
    marks: [
      Plot.barX(data, { y: label, x: 'plays', fill, rx: 2 }),
      Plot.text(data.filter(isWoman), { y: label, x: 'plays', text: (d: Top) => cap(d.who), dx: 6, textAnchor: 'start', fill: ctx.colors.ink, fontSize: 11 }),
    ],
  });
};

// ---------------------------------------------------------------------------
type Life = { artist: string; top10: number[]; plays: number[]; last12: number };
type Fav = { artist: string; top10: number[]; total: number; years: { year: number; plays: number }[] };
type FavData = { lifelines: { months: string[]; artists: Life[] }; favourites: Fav[] };

/** Favourites (scrolly). 0: all 66 lifelines · 1: the six that dropped out ·
 *  2: the 19 that came back, highlighted among all 66 · 3: zoomed in on those
 *  19 · 4: those 19 summed per year. Colour and position never change in the
 *  same step: step 2 only recolours, step 3 only moves.
 *  Every step draws the same 66 rows and 66 names (the ones not in a step
 *  squashed flat and faded out), so the morph can move each row and name to
 *  its new place instead of cross-fading two different charts. */
export const favourites: ChartFn<FavData> = (data, ctx) => {
  const n = narrow(ctx);
  // Height follows the page layout, not the chart width: on phones the chart
  // sits on top with the step cards below it, so it gets about half the
  // screen; side by side it gets what fits under the sticky offset (12vh).
  const phone = matchMedia('(max-width: 760px)').matches;
  const height = phone
    ? Math.max(320, Math.round(window.innerHeight * 0.55))
    : Math.min(680, Math.max(420, Math.round(window.innerHeight * 0.84)));
  const step = Math.min(ctx.step, 4);
  const all = data.lifelines.artists;
  const fav = new Map(data.favourites.map((a) => [a.artist, a]));

  // Row of each artist in this step. Steps 3 and 4 have 19 rows: the others
  // are squashed onto the line between the rows they sat between.
  const kept = all.filter((a) => fav.has(a.artist));
  const row = new Map<string, number>();
  all.forEach((a, i) => {
    if (step < 3) row.set(a.artist, i);
    else if (fav.has(a.artist)) row.set(a.artist, kept.indexOf(a));
    else row.set(a.artist, all.slice(0, i).filter((b) => fav.has(b.artist)).length - 0.5);
  });
  const shown = (a: string) => step < 3 || fav.has(a);
  const nRows = step < 3 ? all.length : kept.length;

  const months = data.lifelines.months.map((m) => new Date(`${m}-01T00:00:00Z`));
  const gap = (m: string) => m >= '2016-11' && m <= '2017-05';
  const rows: any[] = [];
  for (const a of all) {
    const max = Math.max(...a.plays) || 1;
    const r = row.get(a.artist)!;
    const s = shown(a.artist) ? 1 : 0;
    a.plays.forEach((p, k) => {
      const m = data.lifelines.months[k];
      const v = gap(m) ? NaN : Math.sqrt(p / max) * 0.88 * s;
      rows.push({ artist: a.artist, date: months[k], base: r + 1, v: r + 1 - v, top: a.top10.includes(+m.slice(0, 4)), gone: a.last12 === 0 });
    });
  }
  const dropped = step === 1;
  const highlight = step === 2;
  const rowH = (height - 22) / nRows;
  const thin = rowH < 6.5;
  const grey = (d: any) =>
    dropped ? (d.gone ? ctx.colors.accent2 : ctx.colors.line)
      : highlight ? (fav.has(d.artist) ? ctx.colors.faint : ctx.colors.line)
        : ctx.colors.faint;
  // Terracotta (top 10 years): off while the dropouts are shown, only on the
  // 19 in the highlight step. Per row, so the colour can come in without the
  // shapes changing.
  const topOn = (d: any) => (dropped || step === 4 || (highlight && !fav.has(d.artist)) ? 0 : 1);
  // Step 4: the lifelines fade out and yearly blocks take their place, on the
  // same time axis, so each block sits right over the year it sums up.
  const lines = step === 4 ? 0 : 1;
  const first = months[0], last = months[months.length - 1];
  const yearStart = (y: number) => new Date(Math.max(+first, Date.UTC(y, 0, 1)));
  const yearEnd = (y: number) => new Date(Math.min(+last, Date.UTC(y + 1, 0, 1)));
  const cells = step < 4 ? [] : data.favourites.flatMap((a) => a.years.map((y) => ({
    year: y.year, plays: y.plays, r: row.get(a.artist)!, top: a.top10.includes(y.year),
  })));
  const cell = { x1: (d: any) => yearStart(d.year), x2: (d: any) => yearEnd(d.year), y1: (d: any) => d.r + 0.08, y2: (d: any) => d.r + 0.92, insetLeft: 1, insetRight: 1, rx: 2 };
  return Plot.plot({
    ...base(ctx, height),
    marginLeft: n ? (thin && !dropped ? 8 : 112) : 150,
    marginTop: 22,
    x: { label: null, axis: 'top', grid: true, ticks: n ? 4 : 6, domain: [first, last] },
    y: { axis: null, domain: [nRows, 0], reverse: false },
    marks: [
      // Opacities as per-row channels (not constants), so they always sit on
      // the same elements and the morph can tween them.
      Plot.areaY(rows, { x: 'date', y1: 'base', y2: 'v', z: 'artist', fill: grey, fillOpacity: () => lines, curve: 'step' }),
      // Drawn in every step, invisible where it's off, so it always moves
      // with its row instead of fading in somewhere else.
      Plot.areaY(rows, { x: 'date', y1: 'base', y2: (d: any) => (d.top ? d.v : NaN), z: 'artist', fill: ctx.colors.accent, fillOpacity: topOn, curve: 'step' }),
      step === 4 ? Plot.rect(cells, { ...cell, fill: ctx.colors.line }) : null,
      step === 4 ? Plot.rect(cells, { ...cell, fill: ctx.colors.accent, fillOpacity: (d: any) => Math.min(1, Math.sqrt(d.plays / 700)) }) : null,
      step === 4 ? Plot.dot(cells.filter((d) => d.top), {
        x: (d: any) => new Date((+yearStart(d.year) + +yearEnd(d.year)) / 2), y: (d: any) => d.r + 0.5,
        r: 3.5, fill: ctx.colors.bg, stroke: ctx.colors.ink, strokeWidth: 1.2,
      }) : null,
      // Rows thinner than ~8px (66 artists on a phone): only name the dropouts.
      Plot.text(all, {
        x: first, y: (a: Life) => row.get(a.artist)! + 0.55, text: (a: Life) => a.artist, textAnchor: 'end', dx: -6,
        fontSize: Math.max(7.5, Math.min(12, rowH * 1.15)),
        fillOpacity: (a: Life) => (!shown(a.artist) || (thin && !(dropped && a.last12 === 0)) ? 0 : 1),
        fontWeight: (a: Life) => ((dropped && a.last12 === 0) || (highlight && fav.has(a.artist)) ? 600 : 400),
        fill: (a: Life) =>
          dropped ? (a.last12 === 0 ? ctx.colors.ink : ctx.colors.line)
            : highlight ? (fav.has(a.artist) ? ctx.colors.ink : ctx.colors.line)
              : step === 4 ? ctx.colors.ink : ctx.colors.muted,
      }),
    ],
  });
};

// ---------------------------------------------------------------------------
type CountryYear = { year: number; id: string; cc: string; plays: number };
type Country = { cc: string; id: string; plays: number; top: string[] };
export type MapData = { years: CountryYear[]; countries: Country[] };
export const shapes = (feature(world as any, (world as any).objects.countries) as any).features
  .filter((f: any) => f.properties.name !== 'Antarctica');
export const MAP_STEPS = [2015, 2017, 2020, 2026];

/** The world as an even grid of dots, each dot belonging to the country it
 *  falls in. Countries too small to catch a grid point get one dot at their
 *  centre. Cached per size, since it only depends on the layout. */
const dotCache = new Map<string, { x: number; y: number; id: string }[]>();
function dotGrid(width: number, height: number, gap: number) {
  const key = `${width}x${height}x${gap}`;
  if (dotCache.has(key)) return dotCache.get(key)!;
  const proj = geoEqualEarth().fitSize([width, height], { type: 'FeatureCollection', features: shapes } as any);
  const boxes = shapes.map((f: any) => ({ f, b: geoBounds(f) }));
  const inBox = (b: number[][], lon: number, lat: number) =>
    lat >= b[0][1] && lat <= b[1][1] && (b[0][0] <= b[1][0] ? lon >= b[0][0] && lon <= b[1][0] : lon >= b[0][0] || lon <= b[1][0]);
  const dots: { x: number; y: number; id: string }[] = [];
  for (let y = gap / 2; y < height; y += gap) {
    for (let x = gap / 2; x < width; x += gap) {
      const ll = proj.invert!([x, y]);
      if (!ll || !isFinite(ll[0])) continue;
      const hit = boxes.find(({ f, b }: any) => inBox(b, ll[0], ll[1]) && geoContains(f, ll));
      if (hit) dots.push({ x, y, id: hit.f.id });
    }
  }
  const has = new Set(dots.map((d) => d.id));
  for (const f of shapes) {
    if (has.has(f.id)) continue;
    const [x, y] = proj(geoCentroid(f))!;
    dots.push({ x, y, id: f.id });
  }
  dotCache.set(key, dots);
  return dots;
}

/** The dot grid as one <path> per country (every dot a small circle in it).
 *  A few hundred elements instead of thousands of circles, so changing a
 *  country's colour between scrolly steps tweens one attribute, not one per dot. */
const pathCache = new Map<string, { id: string; d: string }[]>();
function countryPaths(width: number, height: number, gap: number, r: number) {
  const key = `${width}x${height}x${gap}x${r}`;
  if (pathCache.has(key)) return pathCache.get(key)!;
  const by = new Map<string, string[]>();
  for (const { x, y, id } of dotGrid(width, height, gap)) {
    if (!by.has(id)) by.set(id, []);
    by.get(id)!.push(`M${(x - r).toFixed(1)},${y.toFixed(1)}a${r},${r} 0 1,0 ${2 * r},0a${r},${r} 0 1,0 ${-2 * r},0`);
  }
  const out = [...by].map(([id, parts]) => ({ id, d: parts.join('') }));
  pathCache.set(key, out);
  return out;
}

/** Countries heard so far (scrolly), as a dot map. Each step: everything up to
 *  that year; countries new since the previous step in sage. The last step is
 *  all terracotta. The dots stay the same between steps, so their colours morph. */
export const worldMap: ChartFn<MapData> = (data, ctx) => {
  const step = Math.min(ctx.step, MAP_STEPS.length - 1);
  const final = step === MAP_STEPS.length - 1;
  const upto = MAP_STEPS[step];
  const before = step > 0 ? MAP_STEPS[step - 1] : 0;
  const cum = new Map<string, number>();
  const first = new Map<string, number>();
  for (const r of data.years) {
    if (r.year > upto) continue;
    cum.set(r.id, (cum.get(r.id) ?? 0) + r.plays);
    first.set(r.id, Math.min(first.get(r.id) ?? 9999, r.year));
  }
  const max = Math.max(...cum.values());
  const isNew = (id: string) => step > 0 && !final && (first.get(id) ?? 0) > before;
  const mapH = Math.round(ctx.width * 0.48);
  const gap = Math.max(4, ctx.width / 140);
  const paths = countryPaths(ctx.width, mapH, gap, +(gap * 0.36).toFixed(2));
  return Plot.plot({
    ...base(ctx, mapH + 30),
    marginTop: 0, marginRight: 0, marginLeft: 0, marginBottom: 30,
    x: { axis: null, domain: [0, ctx.width] },
    y: { axis: null, domain: [mapH, 0] },
    marks: [
      // Pixel coordinates already (the scales are the identity), so this is a
      // plain render function instead of a Plot mark.
      () => {
        const ns = 'http://www.w3.org/2000/svg';
        const g = document.createElementNS(ns, 'g');
        for (const c of paths) {
          const p = document.createElementNS(ns, 'path');
          p.setAttribute('d', c.d);
          p.setAttribute('fill', !cum.has(c.id) ? ctx.colors.line : isNew(c.id) ? ctx.colors.accent2 : ctx.colors.accent);
          p.setAttribute('fill-opacity', String(!cum.has(c.id) || isNew(c.id) ? 1 : +(0.3 + 0.7 * (Math.log10(cum.get(c.id)!) / Math.log10(max))).toFixed(3)));
          g.append(p);
        }
        return g;
      },
      Plot.text([`${upto}: ${cum.size} countries`], { frameAnchor: 'bottom-left', dy: 22, fill: ctx.colors.ink, fontSize: 15, fontWeight: 600 }),
    ],
  });
};
