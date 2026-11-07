// ---------------------------------------------------------------------------
// Scroll-scrubbed transitions between two renders of the same chart (used
// between the steps of a <Scrolly>). Charts stay "data + context → SVG"; this
// file compares the render of step k with the render of step k+1 and builds a
// transition that can be set to any point t in [0, 1]. The scroll position
// decides t, so the chart morphs with every pixel scrolled (and back again),
// instead of playing a timed animation once a trigger line is crossed.
//
// - mark groups that kept their shape (same elements, same text) are tweened:
//   positions, paths, colours and opacity are interpolated;
// - groups that changed shape cross-fade (old copy fades out, new fades in);
// - if the whole chart changed size, the two charts cross-fade as a whole.
//
// At t = 0 and t = 1 the untouched renders themselves are shown, so tooltips
// and pointer interactions work exactly as in a static chart.
// ---------------------------------------------------------------------------

/** Attributes holding numbers that can be interpolated (paths, positions). */
const GEOMETRY = ['d', 'x', 'y', 'x1', 'x2', 'y1', 'y2', 'cx', 'cy', 'r', 'width', 'height', 'transform', 'points'];
/** Attributes holding colours or opacities. */
const PAINT = ['fill', 'stroke', 'fill-opacity', 'stroke-opacity', 'opacity'];

const NUM = /-?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?/gi;

type Tween = (t: number) => void;

/** "M1,2L3,4" → t => "M…" if both strings share the same non-numeric skeleton. */
function numbers(a: string, b: string): ((t: number) => string) | null {
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

// Any CSS colour (rgb, color(srgb …), oklch, names) → RGBA bytes, via a 1×1
// canvas, so color-mix() results and modern colour syntaxes all work.
const rgbaCache = new Map<string, number[] | null>();
let pixel: CanvasRenderingContext2D | null = null;
function rgba(c: string): number[] | null {
  if (rgbaCache.has(c)) return rgbaCache.get(c)!;
  let out: number[] | null = null;
  if (c && c !== 'none' && !c.startsWith('url(') && CSS.supports('color', c)) {
    pixel ??= document.createElement('canvas').getContext('2d', { willReadFrequently: true });
    if (pixel) {
      pixel.clearRect(0, 0, 1, 1);
      pixel.fillStyle = c;
      pixel.fillRect(0, 0, 1, 1);
      out = [...pixel.getImageData(0, 0, 1, 1).data];
    }
  }
  rgbaCache.set(c, out);
  return out;
}

/** Interpolator for a paint value: numbers, colours, else a switch halfway. */
function paint(a: string, b: string): (t: number) => string {
  if (a.trim() && b.trim() && !isNaN(+a) && !isNaN(+b)) return (t) => String(+(+a + (+b - +a) * t).toFixed(3));
  const A = rgba(a), B = rgba(b);
  if (A && B) {
    return (t) => {
      const [r, g, bl, al] = A.map((v, i) => v + (B[i] - v) * t);
      return `rgba(${Math.round(r)},${Math.round(g)},${Math.round(bl)},${+(al / 255).toFixed(3)})`;
    };
  }
  return (t) => (t < 0.5 ? a : b);
}

/** What a mark group looks like: its element tags, plus the text it shows. */
function signature(g: Element): string {
  const els = [g, ...g.querySelectorAll('*')];
  return els.map((e) => e.tagName).join(',') + '|' + (g.textContent ?? '');
}

/** Tweens from `o` to `n` (same structure), or null if a shape can't be interpolated. */
function groupTweens(o: Element, n: Element): Tween[] | null {
  const olds = [o, ...o.querySelectorAll('*')];
  const news = [n, ...n.querySelectorAll('*')];
  const tweens: Tween[] = [];
  for (let i = 0; i < news.length; i++) {
    const a = olds[i], b = news[i];
    for (const attr of GEOMETRY) {
      const from = a.getAttribute(attr), to = b.getAttribute(attr);
      if (from === to) continue;
      if (from === null || to === null) return null;
      const f = numbers(from, to);
      if (!f) return null;
      tweens.push((t) => b.setAttribute(attr, t >= 1 ? to : f(t)));
    }
    for (const attr of PAINT) {
      const from = a.getAttribute(attr), to = b.getAttribute(attr);
      if (from === to) continue;
      // Missing on one side: use the SVG default (fill black, stroke none, opacity 1).
      const dflt = attr === 'stroke' ? 'none' : attr === 'fill' ? 'black' : '1';
      const f = paint(from ?? dflt, to ?? dflt);
      tweens.push((t) => {
        if (t < 1) b.setAttribute(attr, f(t));
        else if (to === null) b.removeAttribute(attr);
        else b.setAttribute(attr, to);
      });
    }
  }
  return tweens;
}

const svgOf = (n: Element) => (n.tagName.toLowerCase() === 'svg' ? n : n.querySelector('svg'));
const sameSize = (a: Element, b: Element) =>
  a.getAttribute('width') === b.getAttribute('width') && a.getAttribute('height') === b.getAttribute('height');

const setOpacity = (el: Element, v: number) => {
  (el as HTMLElement).style.opacity = v >= 1 ? '' : String(+v.toFixed(3));
};

export interface Scrub {
  /** Show the transition at t (0 = render a, 1 = render b) inside `host`. */
  show(host: HTMLElement, t: number): void;
  /** Put both renders back exactly as they were, so they can be reused. */
  reset(): void;
}

/** Build a seekable transition from render `a` to render `b`. Neither is
 *  changed until `show` is called, and `reset` undoes every change. */
export function scrubber(a: Element, b: Element): Scrub {
  const sa = svgOf(a), sb = svgOf(b);
  const place = (host: HTMLElement, el: Element) => {
    if (host.firstElementChild !== el || host.childElementCount !== 1) host.replaceChildren(el);
  };
  return sa && sb && sameSize(sa, sb) ? tweened(a, b, sa, sb, place) : crossfade(a, b, place);
}

type Place = (host: HTMLElement, el: Element) => void;

/** Same size: tween the mark groups that kept their shape, fade the rest. */
function tweened(a: Element, b: Element, sa: Element, sb: Element, place: Place): Scrub {
  const oldGroups = [...sa.children].filter((e) => e.tagName.toLowerCase() === 'g');
  const newGroups = [...sb.children].filter((e) => e.tagName.toLowerCase() === 'g');
  const used = new Set<Element>();
  const oldSig = new Map(oldGroups.map((g) => [g, signature(g)]));
  const tweens: Tween[] = [];
  const fadeIns: Element[] = [];

  for (const g of newGroups) {
    const sig = signature(g);
    const match = oldGroups.find((o) => !used.has(o) && oldSig.get(o) === sig);
    const tw = match ? groupTweens(match, g) : null;
    if (!match || !tw) { fadeIns.push(g); continue; }
    used.add(match);
    tweens.push(...tw);
  }

  // Old groups with nothing to turn into: a copy that fades out on top of b.
  // Only in b while the transition is under way, so b stays reusable.
  const fadeOuts: [SVGElement, number][] = oldGroups.flatMap((o, i) => {
    if (used.has(o)) return [];
    const copy = o.cloneNode(true) as SVGElement;
    copy.style.pointerEvents = 'none';
    return [[copy, i] as [SVGElement, number]];
  });
  const copies = (on: boolean) => {
    for (const [c, i] of fadeOuts) {
      if (on && !c.parentNode) sb.insertBefore(c, sb.children[i + 1] ?? null);
      if (!on) c.remove();
    }
  };

  const seek = (t: number) => {
    for (const f of tweens) f(t);
    for (const g of fadeIns) setOpacity(g, t);
    copies(t < 1);
    for (const [c] of fadeOuts) setOpacity(c, 1 - t);
  };

  return {
    show(host, t) {
      if (t <= 0) return place(host, a);
      seek(Math.min(1, t));
      place(host, b);
    },
    reset: () => seek(1),
  };
}

/** Different size (or no SVG): stack both renders, cross-fade, ease the height. */
function crossfade(a: Element, b: Element, place: Place): Scrub {
  const A = a as HTMLElement, B = b as HTMLElement;
  const stack = document.createElement('div');
  stack.style.cssText = 'display:grid;position:relative';
  let ha = 0, hb = 0;
  const reset = () => {
    for (const el of [A, B]) Object.assign(el.style, { gridArea: '', alignSelf: '', opacity: '', pointerEvents: '' });
  };
  return {
    reset,
    show(host, t) {
      if (t <= 0 || t >= 1) {
        reset();
        return place(host, t <= 0 ? a : b);
      }
      place(host, stack);
      if (stack.childElementCount < 2) {
        for (const el of [A, B]) Object.assign(el.style, { gridArea: '1 / 1', alignSelf: 'start' });
        stack.style.height = '';
        stack.replaceChildren(a, b);
        ha = A.offsetHeight;
        hb = B.offsetHeight;
      }
      stack.style.height = `${ha + (hb - ha) * t}px`;
      setOpacity(a, 1 - t);
      setOpacity(b, t);
      A.style.pointerEvents = 'none';
    },
  };
}
