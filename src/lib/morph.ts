// ---------------------------------------------------------------------------
// Scroll-scrubbed transitions between two renders of the same chart (used
// between the steps of a <Scrolly>). Charts stay "data + context → SVG"; this
// file compares the render of step k with the render of step k+1 and builds a
// paused GSAP timeline from one to the other. The scroll position sets the
// timeline's progress, so the chart morphs with every pixel scrolled (and back
// again), instead of playing a timed animation once a trigger line is crossed.
//
// - mark groups that kept their shape (same elements, same text) are tweened:
//   GSAP interpolates positions, paths, colours and opacity;
// - groups that changed shape cross-fade (old copy fades out, new fades in);
// - if the whole chart changed size, the two charts cross-fade as a whole.
//
// What GSAP doesn't do, and stays here: deciding which groups match, and
// turning modern CSS colours (color-mix, color(srgb …)) into rgba it can tween.
// At t = 0 and t = 1 the untouched renders themselves are shown, so tooltips
// and pointer interactions work exactly as in a static chart.
// ---------------------------------------------------------------------------
import { gsap } from './motion';

/** Attributes holding numbers that can be interpolated (paths, positions). */
const GEOMETRY = ['d', 'x', 'y', 'x1', 'x2', 'y1', 'y2', 'cx', 'cy', 'r', 'width', 'height', 'transform', 'points', 'font-size'];
/** Attributes holding colours or opacities. */
const PAINT = ['fill', 'stroke', 'fill-opacity', 'stroke-opacity', 'opacity'];

const NUM = /-?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?/gi;

/** Two strings GSAP can tween: the same text around the same count of numbers. */
const sameSkeleton = (a: string, b: string) => {
  const sa = a.split(NUM), sb = b.split(NUM);
  return sa.length === sb.length && sa.every((s, i) => s === sb[i]);
};

// Any CSS colour (rgb, color(srgb …), oklch, names) → rgba(), via a 1×1
// canvas, so color-mix() results and modern colour syntaxes all tween.
const rgbaCache = new Map<string, string | null>();
let pixel: CanvasRenderingContext2D | null = null;
function rgba(c: string): string | null {
  if (rgbaCache.has(c)) return rgbaCache.get(c)!;
  let out: string | null = null;
  if (c && c !== 'none' && !c.startsWith('url(') && CSS.supports('color', c)) {
    pixel ??= document.createElement('canvas').getContext('2d', { willReadFrequently: true });
    if (pixel) {
      pixel.clearRect(0, 0, 1, 1);
      pixel.fillStyle = c;
      pixel.fillRect(0, 0, 1, 1);
      const [r, g, b, a] = pixel.getImageData(0, 0, 1, 1).data;
      out = `rgba(${r},${g},${b},${+(a / 255).toFixed(3)})`;
    }
  }
  rgbaCache.set(c, out);
  return out;
}

/** What a mark group looks like: its element tags, plus the text it shows. */
function signature(g: Element): string {
  const els = [g, ...g.querySelectorAll('*')];
  return els.map((e) => e.tagName).join(',') + '|' + (g.textContent ?? '');
}

type Change = { el: Element; attr: string; from: string; to: string | null };

/** What SVG uses for a paint attribute that isn't set. */
const paintDefault = (attr: string) => (attr === 'stroke' ? 'none' : attr === 'fill' ? 'black' : '1');

/** Attribute changes from `o` to `n` (same structure), or null if a shape can't be interpolated. */
function groupChanges(o: Element, n: Element): Change[] | null {
  const olds = [o, ...o.querySelectorAll('*')];
  const news = [n, ...n.querySelectorAll('*')];
  const out: Change[] = [];
  for (let i = 0; i < news.length; i++) {
    const a = olds[i], b = news[i];
    for (const attr of GEOMETRY) {
      const from = a.getAttribute(attr), to = b.getAttribute(attr);
      if (from === to) continue;
      if (from === null || to === null || !sameSkeleton(from, to)) return null;
      out.push({ el: b, attr, from, to });
    }
    for (const attr of PAINT) {
      const from = a.getAttribute(attr), to = b.getAttribute(attr);
      if (from === to) continue;
      // Missing on one side: tween from/to the SVG default (fill black,
      // stroke none, opacity 1). Plot leaves out fill-opacity when it is 1.
      out.push({ el: b, attr, from: from ?? paintDefault(attr), to });
    }
  }
  return out;
}

const svgOf = (n: Element) => (n.tagName.toLowerCase() === 'svg' ? n : n.querySelector('svg'));
const sameSize = (a: Element, b: Element) =>
  a.getAttribute('width') === b.getAttribute('width') && a.getAttribute('height') === b.getAttribute('height');

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

/** A timeline that is only ever seeked, never played: progress = scroll. */
const seekable = () => gsap.timeline({ paused: true, defaults: { ease: 'none', duration: 1 } });

/** Same size: tween the mark groups that kept their shape, fade the rest. */
function tweened(a: Element, b: Element, sa: Element, sb: Element, place: Place): Scrub {
  const oldGroups = [...sa.children].filter((e) => e.tagName.toLowerCase() === 'g');
  const newGroups = [...sb.children].filter((e) => e.tagName.toLowerCase() === 'g');
  const used = new Set<Element>();
  const oldSig = new Map(oldGroups.map((g) => [g, signature(g)]));
  const changes: Change[] = [];
  const fadeIns: Element[] = [];

  for (const g of newGroups) {
    const sig = signature(g);
    const match = oldGroups.find((o) => !used.has(o) && oldSig.get(o) === sig);
    const ch = match ? groupChanges(match, g) : null;
    if (!match || !ch) { fadeIns.push(g); continue; }
    used.add(match);
    changes.push(...ch);
  }

  // Old groups with nothing to turn into: a copy that fades out on top of b.
  // Only in b while the transition is under way, so b stays reusable.
  const fadeOuts: [SVGElement, number][] = oldGroups.flatMap((o, i) => {
    if (used.has(o)) return [];
    const copy = o.cloneNode(true) as SVGElement;
    copy.style.pointerEvents = 'none';
    return [[copy, i] as [SVGElement, number]];
  });

  let tl: gsap.core.Timeline | null = null;
  const build = () => {
    tl = seekable();
    for (const c of changes) {
      // Colours go through rgba(); anything else that can't tween switches halfway.
      const end = c.to ?? (PAINT.includes(c.attr) ? paintDefault(c.attr) : null);
      const isPaint = PAINT.includes(c.attr) && isNaN(+c.from);
      const from = isPaint ? rgba(c.from) : c.from;
      const to = end === null ? null : isPaint ? rgba(end) : end;
      if (from !== null && to !== null) tl.fromTo(c.el, { attr: { [c.attr]: from } }, { attr: { [c.attr]: to } }, 0);
      else tl.set(c.el, { attr: { [c.attr]: c.to ?? c.from } }, 0.5);
    }
    if (fadeIns.length) tl.fromTo(fadeIns, { opacity: 0 }, { opacity: 1 }, 0);
    if (fadeOuts.length) tl.fromTo(fadeOuts.map(([c]) => c), { opacity: 1 }, { opacity: 0 }, 0);
  };
  const copies = (on: boolean) => {
    for (const [c, i] of fadeOuts) {
      if (on && !c.parentNode) sb.insertBefore(c, sb.children[i + 1] ?? null);
      if (!on) c.remove();
    }
  };
  // Back to b exactly as rendered: the end values, then no inline styles or
  // attributes the timeline added.
  const reset = () => {
    if (!tl) return;
    tl.progress(1).kill();
    tl = null;
    for (const c of changes) {
      if (c.to === null) c.el.removeAttribute(c.attr);
      else c.el.setAttribute(c.attr, c.to);
    }
    gsap.set(fadeIns, { clearProps: 'opacity' });
    copies(false);
  };

  return {
    show(host, t) {
      if (t <= 0) return place(host, a);
      if (t >= 1) { reset(); return place(host, b); }
      if (!tl) build();
      copies(true);
      tl!.progress(t);
      place(host, b);
    },
    reset,
  };
}

/** Different size (or no SVG): stack both renders, cross-fade, ease the height. */
function crossfade(a: Element, b: Element, place: Place): Scrub {
  const A = a as HTMLElement, B = b as HTMLElement;
  const stack = document.createElement('div');
  stack.style.cssText = 'display:grid;position:relative';
  let tl: gsap.core.Timeline | null = null;
  const reset = () => {
    tl?.kill();
    tl = null;
    gsap.set([A, B], { clearProps: 'gridArea,alignSelf,opacity,pointerEvents' });
    stack.style.height = '';
  };
  return {
    reset,
    show(host, t) {
      if (t <= 0 || t >= 1) {
        reset();
        return place(host, t <= 0 ? a : b);
      }
      place(host, stack);
      if (!tl) {
        gsap.set([A, B], { gridArea: '1 / 1', alignSelf: 'start' });
        gsap.set(A, { pointerEvents: 'none' });
        stack.replaceChildren(a, b);
        tl = seekable()
          .fromTo(stack, { height: A.offsetHeight }, { height: B.offsetHeight }, 0)
          .fromTo(A, { opacity: 1 }, { opacity: 0 }, 0)
          .fromTo(B, { opacity: 0 }, { opacity: 1 }, 0);
      }
      tl.progress(t);
    },
  };
}
