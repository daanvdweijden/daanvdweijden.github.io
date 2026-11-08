// ---------------------------------------------------------------------------
// Entrance for charts outside a <Scrolly>, on GSAP. Once a chart comes into
// view it plays one timed cascade (about a second and a half), the same for
// every chart; only the marks move, axes stay put.
//
// - Horizontal bars (the top 50) grow from the left, row after row.
// - Vertical bars, stacked or not, grow up from the axis, column by column.
// - Anything else (areas, lines, dots) is wiped in from left to right.
// Labels drawn next to the marks fade in as their bar or the wipe reaches them.
// A redraw (resize, theme switch) after the cascade shows the chart at once.
// ---------------------------------------------------------------------------
import { gsap, ScrollTrigger } from './motion';

const NS = 'http://www.w3.org/2000/svg';
const FAR = 1e4;
/** Time from the first bar starting to the last one starting (s). */
const SPREAD = 1;
/** How long one bar takes to grow (s). */
const GROW = 0.7;
let uid = 0;

/** Animations of earlier renders, killed once their svg is replaced. */
const live = new Set<{ svg: SVGSVGElement; kill: () => void }>();
/** Hosts whose cascade already played. */
const played = new WeakSet<Element>();

const markGroups = (svg: SVGSVGElement) =>
  [...svg.children].filter(
    (g) => g.tagName.toLowerCase() === 'g' && !/axis|grid|frame/i.test(g.getAttribute('aria-label') ?? ''),
  ) as SVGGElement[];

const tag = (el: Element) => el.tagName.toLowerCase();

/** Group items by a key, rounded so bars in the same row or column share it. */
function groupBy<T>(items: T[], key: (t: T) => number): T[][] {
  const map = new Map<number, T[]>();
  for (const it of items) {
    const k = Math.round(key(it));
    if (!map.has(k)) map.set(k, []);
    map.get(k)!.push(it);
  }
  return [...map.entries()].sort((a, b) => a[0] - b[0]).map(([, v]) => v);
}

/** Put every label with the group whose middle is closest to it. */
function attach(texts: SVGGraphicsElement[], centres: number[], axis: 'x' | 'y') {
  const out: SVGGraphicsElement[][] = centres.map(() => []);
  for (const t of texts) {
    const b = t.getBBox();
    const mid = axis === 'y' ? b.y + b.height / 2 : b.x + b.width / 2;
    let i = 0;
    centres.forEach((c, k) => { if (Math.abs(c - mid) < Math.abs(centres[i] - mid)) i = k; });
    out[i].push(t);
  }
  return out;
}

export function reveal(node: Element) {
  for (const it of live) if (!it.svg.isConnected) { it.kill(); live.delete(it); }
  const svg = (tag(node) === 'svg' ? node : node.querySelector('svg')) as SVGSVGElement | null;
  if (!svg) return;
  const host = svg.parentElement ?? svg;
  if (played.has(host)) return;
  const marks = markGroups(svg);
  if (!marks.length) return;

  const all = marks.flatMap((g) => [...g.querySelectorAll<SVGGraphicsElement>('*')]);
  const rects = all.filter((e) => tag(e) === 'rect');
  const texts = all.filter((e) => tag(e) === 'text');
  const others = all.filter((e) => !['rect', 'text', 'g', 'tspan', 'title'].includes(tag(e)));

  const tl = gsap.timeline({ paused: true, onComplete: () => { played.add(host); } });
  if (rects.length >= 3 && !others.length) bars(tl, rects, texts);
  else wipe(tl, svg, marks);

  const st = ScrollTrigger.create({ trigger: svg, start: 'top 85%', once: true, onEnter: () => tl.play() });
  // Just stop: the old svg is gone, and finishing it would mark the host as
  // played, so the new render would skip its cascade.
  live.add({ svg, kill: () => { st.kill(); tl.kill(); } });
}

/** Bars grow one row (horizontal) or column (vertical) at a time. */
function bars(tl: gsap.core.Timeline, rects: SVGGraphicsElement[], texts: SVGGraphicsElement[]) {
  const boxes = new Map(rects.map((r) => [r, r.getBBox()]));
  const box = (r: SVGGraphicsElement) => boxes.get(r)!;
  // Horizontal bars all have the band's height and differ in width; vertical
  // bars (and stack segments) share a width and differ in height.
  const distinct = (f: (b: DOMRect) => number) => new Set(rects.map((r) => Math.round(f(box(r))))).size;
  const horizontal = distinct((b) => b.height) < distinct((b) => b.width);
  // Bars in one row share their top; bars in one column share their left.
  const groups = horizontal ? groupBy(rects, (r) => box(r).y) : groupBy(rects, (r) => box(r).x);
  const each = Math.min(0.06, SPREAD / groups.length);
  const centres = groups.map((g) => {
    const b = box(g[0]);
    return horizontal ? b.y + b.height / 2 : b.x + b.width / 2;
  });
  const labels = attach(texts, centres, horizontal ? 'y' : 'x');
  gsap.set(texts, { autoAlpha: 0 });

  groups.forEach((g, i) => {
    const at = i * each;
    if (horizontal) {
      gsap.set(g, { scaleX: 0, transformOrigin: '0% 50%' });
      tl.to(g, { scaleX: 1, duration: GROW, ease: 'power3.out' }, at);
    } else {
      // The whole column grows from the axis, so a stack rises as one bar.
      const base = Math.max(...g.map((r) => box(r).y + box(r).height));
      const cx = box(g[0]).x + box(g[0]).width / 2;
      gsap.set(g, { scaleY: 0, svgOrigin: `${cx} ${base}` });
      tl.to(g, { scaleY: 1, duration: GROW, ease: 'power3.out' }, at);
    }
    if (labels[i].length) tl.to(labels[i], { autoAlpha: 1, duration: 0.4 }, at + GROW / 2);
  });
}

/** Areas, lines and dots: a clip edge that runs from left to right. */
function wipe(tl: gsap.core.Timeline, svg: SVGSVGElement, marks: SVGGElement[]) {
  let x0 = Infinity, x1 = -Infinity;
  for (const g of marks) {
    const b = g.getBBox();
    if (!b.width && !b.height) continue;
    x0 = Math.min(x0, b.x); x1 = Math.max(x1, b.x + b.width);
  }
  if (!isFinite(x0)) return;
  const id = `reveal-${++uid}`;
  const defs = document.createElementNS(NS, 'defs');
  const clip = document.createElementNS(NS, 'clipPath');
  clip.id = id;
  clip.setAttribute('clipPathUnits', 'userSpaceOnUse');
  const edge = document.createElementNS(NS, 'rect');
  for (const [k, v] of Object.entries({ x: -FAR, y: -FAR, height: 2 * FAR, width: x0 - 4 + FAR })) edge.setAttribute(k, String(v));
  clip.append(edge);
  defs.append(clip);
  svg.prepend(defs);
  // A plain wrapper, so the clip is in the svg's coordinates even when the
  // mark group itself is translated.
  for (const g of marks) {
    const wrap = document.createElementNS(NS, 'g');
    wrap.setAttribute('clip-path', `url(#${id})`);
    g.replaceWith(wrap);
    wrap.append(g);
  }
  tl.to(edge, { attr: { width: x1 + 4 + FAR }, duration: SPREAD + GROW / 2, ease: 'power2.inOut' })
    // Fully in: open the clip all the way, so nothing is ever cut off.
    .set(edge, { attr: { width: 3 * FAR } });
}
