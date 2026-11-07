// ---------------------------------------------------------------------------
// Smooth transitions between two renders of the same chart (used when a
// <Scrolly> moves to another step). Charts stay "data + context → SVG"; this
// file compares the old SVG with the new one and animates the difference:
//
// - mark groups that kept their shape (same elements, same text) are tweened:
//   positions and paths are interpolated, colours and opacity transition;
// - groups that changed shape cross-fade (old copy fades out, new fades in);
// - if the whole chart changed size, the two SVGs simply cross-fade.
// ---------------------------------------------------------------------------

const DURATION = 750;
const EASE_CSS = 'cubic-bezier(.65,0,.35,1)';
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

/** Attributes holding numbers that can be interpolated (paths, positions). */
const GEOMETRY = ['d', 'x', 'y', 'x1', 'x2', 'y1', 'y2', 'cx', 'cy', 'r', 'width', 'height', 'transform', 'points'];
/** Attributes that CSS can transition. */
const PAINT = ['fill', 'stroke', 'fill-opacity', 'stroke-opacity', 'opacity'];

const NUM = /-?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?/gi;

/** "M1,2L3,4" → t => "M…" if both strings share the same non-numeric skeleton. */
function interpolator(a: string, b: string): ((t: number) => string) | null {
  const na = a.match(NUM), nb = b.match(NUM);
  if (!na || !nb || na.length !== nb.length) return null;
  const sa = a.split(NUM), sb = b.split(NUM);
  if (sa.length !== sb.length || sa.some((s, i) => s !== sb[i])) return null;
  const A = na.map(Number), B = nb.map(Number);
  return (t) => {
    let out = sa[0];
    for (let i = 0; i < A.length; i++) out += +(A[i] + (B[i] - A[i]) * t).toFixed(2) + sa[i + 1];
    return out;
  };
}

/** What a mark group looks like: its element tags, plus the text it shows. */
function signature(g: Element): string {
  const els = [g, ...g.querySelectorAll('*')];
  return els.map((e) => e.tagName).join(',') + '|' + (g.textContent ?? '');
}

const svgOf = (n: Element) => (n.tagName.toLowerCase() === 'svg' ? n : n.querySelector('svg'));
const sameSize = (a: Element, b: Element) =>
  a.getAttribute('width') === b.getAttribute('width') && a.getAttribute('height') === b.getAttribute('height');

function fadeIn(el: Element) {
  const s = (el as SVGElement).style;
  s.opacity = '0';
  requestAnimationFrame(() => requestAnimationFrame(() => {
    s.transition = `opacity ${DURATION}ms ${EASE_CSS}`;
    s.opacity = '';
  }));
}

function fadeOut(el: Element) {
  const s = (el as SVGElement).style;
  s.pointerEvents = 'none';
  requestAnimationFrame(() => requestAnimationFrame(() => {
    s.transition = `opacity ${DURATION}ms ${EASE_CSS}`;
    s.opacity = '0';
  }));
  setTimeout(() => el.remove(), DURATION + 50);
}

let token = 0;

/**
 * Animate from `prev` (the old render, already replaced) to `next` (in the DOM,
 * inside `host`). Call right after swapping them.
 */
export function morph(prev: Element, next: Element, host: HTMLElement) {
  const a = svgOf(prev), b = svgOf(next);
  if (!a || !b) return;
  const id = ++token;

  // Different size: cross-fade the whole chart.
  if (!sameSize(a, b)) {
    host.style.position = 'relative';
    Object.assign((prev as HTMLElement).style, { position: 'absolute', top: '0', left: '0', width: '100%' });
    host.prepend(prev);
    fadeOut(prev);
    fadeIn(next);
    return;
  }

  // Pair top-level mark groups that kept their shape, in order.
  const oldGroups = [...a.children].filter((e) => e.tagName.toLowerCase() === 'g');
  const newGroups = [...b.children].filter((e) => e.tagName.toLowerCase() === 'g');
  const used = new Set<Element>();
  const oldSig = new Map(oldGroups.map((g) => [g, signature(g)]));
  const tweens: ((t: number) => void)[] = [];

  for (const g of newGroups) {
    const sig = signature(g);
    const match = oldGroups.find((o) => !used.has(o) && oldSig.get(o) === sig);
    if (!match) { fadeIn(g); continue; }
    used.add(match);
    const olds = [match, ...match.querySelectorAll('*')];
    const news = [g, ...g.querySelectorAll('*')];
    news.forEach((n, i) => {
      const o = olds[i];
      for (const attr of GEOMETRY) {
        const from = o.getAttribute(attr), to = n.getAttribute(attr);
        if (from === null || to === null || from === to) continue;
        const f = interpolator(from, to);
        if (!f) continue;
        n.setAttribute(attr, from);
        tweens.push((t) => n.setAttribute(attr, t >= 1 ? to : f(t)));
      }
      const style = (n as SVGElement).style;
      for (const attr of PAINT) {
        // A transition still running on the old element: start from where it is.
        const from = (o as SVGElement).style.getPropertyValue(attr) || o.getAttribute(attr);
        const to = n.getAttribute(attr);
        if (from === null || to === null || from === to) continue;
        style.setProperty(attr, from);
        requestAnimationFrame(() => requestAnimationFrame(() => {
          style.transition = PAINT.map((p) => `${p} ${DURATION}ms ${EASE_CSS}`).join(',');
          style.setProperty(attr, to);
        }));
      }
    });
  }

  // Old groups with nothing to turn into: fade a copy out on top of the new chart.
  oldGroups.forEach((o, i) => {
    if (used.has(o)) return;
    const copy = o.cloneNode(true) as Element;
    b.insertBefore(copy, b.children[i + 1] ?? null);
    fadeOut(copy);
  });

  if (!tweens.length) return;
  const start = performance.now();
  const frame = (now: number) => {
    if (id !== token) { tweens.forEach((f) => f(1)); return; }
    const t = Math.min(1, (now - start) / DURATION);
    const e = t >= 1 ? 1 : ease(t);
    tweens.forEach((f) => f(e));
    if (t < 1) requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}
