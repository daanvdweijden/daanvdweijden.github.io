// ---------------------------------------------------------------------------
// Scroll-linked entrance for charts outside a <Scrolly>. The marks (not the
// axes) are revealed from left to right as the chart scrolls up into view:
// for charts over time it reads as time unfolding, for horizontal bars as the
// bars growing. Like the scrollies it follows the scroll position (and runs
// backwards when scrolling up), eased per frame so it never steps.
//
// Short charts sweep in with one straight edge, timed by where the chart's
// upper part is on screen. Tall charts made of rows (the top 50) reveal row by
// row instead: every bar has its own flat edge, timed by where that row is.
// ---------------------------------------------------------------------------

/** A height on screen is hidden at START × viewport and fully shown at END × viewport. */
const START = 0.9;
const END = 0.55;
/** How far the reveal may trail behind the scroll (ms). */
const TAU = 90;
const FAR = 1e4;

interface Item {
  svg: SVGSVGElement;
  edge: SVGPathElement;
  x0: number; x1: number;
  /** Horizontal bands (svg units) that each get their own edge: [top, bottom]. */
  bands: [number, number][];
  /** Eased on-screen top of the chart. */
  top: number;
}

/** Rows of a horizontal bar chart: rect bands that don't overlap, merged. */
function rows(marks: Element[]): [number, number][] {
  const spans = marks
    .flatMap((g) => [...g.querySelectorAll('rect')])
    .map((r) => [+(r.getAttribute('y') ?? NaN), +(r.getAttribute('height') ?? NaN)])
    .filter(([y, h]) => isFinite(y) && isFinite(h) && h > 0)
    .map(([y, h]) => [y, y + h] as [number, number])
    .sort((a, b) => a[0] - b[0]);
  const out: [number, number][] = [];
  for (const sp of spans) {
    const last = out[out.length - 1];
    if (last && sp[0] < last[1] - 0.5) last[1] = Math.max(last[1], sp[1]);
    else out.push([...sp]);
  }
  return out;
}

const items = new Set<Item>();
const clamp = (v: number) => Math.min(1, Math.max(0, v));
// Slow, fast, slow: the sweep eases in and out like a physical motion.
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
let uid = 0;

const NS = 'http://www.w3.org/2000/svg';

/** Wrap the mark groups of a freshly inserted chart in a scroll-driven clip. */
export function reveal(node: Element) {
  const svg = (node.tagName.toLowerCase() === 'svg' ? node : node.querySelector('svg')) as SVGSVGElement | null;
  if (!svg) return;
  const marks = [...svg.children].filter(
    (g) => g.tagName.toLowerCase() === 'g' && !/axis|tip|grid|frame/i.test(g.getAttribute('aria-label') ?? ''),
  ) as SVGGElement[];
  if (!marks.length) return;

  // Extent of the marks, in the svg's own units.
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
  for (const g of marks) {
    const b = g.getBBox();
    if (!b.width && !b.height) continue;
    x0 = Math.min(x0, b.x); x1 = Math.max(x1, b.x + b.width);
    y0 = Math.min(y0, b.y); y1 = Math.max(y1, b.y + b.height);
  }
  if (!isFinite(x0)) return;

  const id = `reveal-${++uid}`;
  const defs = document.createElementNS(NS, 'defs');
  const clip = document.createElementNS(NS, 'clipPath');
  clip.id = id;
  clip.setAttribute('clipPathUnits', 'userSpaceOnUse');
  const edge = document.createElementNS(NS, 'path');
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

  const rect = svg.getBoundingClientRect();
  const scale = rect.height / (svg.viewBox.baseVal?.height || Number(svg.getAttribute('height')) || rect.height);
  const r = rows(marks);
  const tall = (y1 - y0) * scale > innerHeight * 0.5 && r.length >= 6;
  const bands: [number, number][] = tall ? r : [[y0, y1]];
  const item: Item = { svg, edge, x0: x0 - 4, x1: x1 + 4, bands, top: rect.top };
  items.add(item);
  paint(item);
  kick();
}

function paint(it: Item) {
  const rect = it.svg.getBoundingClientRect();
  const vbH = it.svg.viewBox.baseVal?.height || Number(it.svg.getAttribute('height')) || rect.height;
  const scale = rect.height / vbH;
  const vh = innerHeight;
  const pts: string[] = [`M${-FAR},${-FAR}`];
  let all = true;
  const n = it.bands.length;
  it.bands.forEach(([b0, b1], i) => {
    // Timed by a point a quarter down the band, so a short chart has grown
    // in by the time most of it is on screen.
    const mid = b0 + (b1 - b0) * 0.25;
    const p = easeInOut(clamp((vh * START - (it.top + mid * scale)) / (vh * (START - END))));
    if (p < 1) all = false;
    const x = (it.x0 + (it.x1 - it.x0) * p).toFixed(1);
    // Each band's edge runs to halfway into the gaps around it.
    const from = i === 0 ? -FAR : (b0 + it.bands[i - 1][1]) / 2;
    const to = i === n - 1 ? FAR : (b1 + it.bands[i + 1][0]) / 2;
    pts.push(`L${x},${from.toFixed(1)}L${x},${to.toFixed(1)}`);
  });
  pts.push(`L${-FAR},${FAR}Z`);
  // Fully in view: no clip edge at all, so nothing is ever cut off.
  it.edge.setAttribute('d', all ? `M${-FAR},${-FAR}H${FAR}V${FAR}H${-FAR}Z` : pts.join(''));
}

let looping = false;
let last = 0;
function frame(now: number) {
  const k = 1 - Math.exp(-Math.min(64, now - last) / TAU);
  last = now;
  let moving = false;
  for (const it of items) {
    if (!it.svg.isConnected) { items.delete(it); continue; }
    const to = it.svg.getBoundingClientRect().top;
    // Off screen (and not about to come on): nothing to show.
    if (to > innerHeight * 1.5 || to + it.svg.getBoundingClientRect().height < -innerHeight * 0.5) { it.top = to; continue; }
    const next = Math.abs(to - it.top) < 0.5 ? to : it.top + (to - it.top) * k;
    if (next === it.top && next === to) continue;
    it.top = next;
    paint(it);
    if (next !== to) moving = true;
  }
  looping = moving;
  if (moving) requestAnimationFrame(frame);
}
function kick() {
  if (looping) return;
  looping = true;
  last = performance.now();
  requestAnimationFrame(frame);
}
addEventListener('scroll', kick, { passive: true });
addEventListener('resize', kick);
