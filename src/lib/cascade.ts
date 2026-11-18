// ---------------------------------------------------------------------------
// Entrance for pages without charts (music, books), in the spirit of
// lib/reveal.ts: things play in once, as they scroll into view.
//
// - countUp: a big stat number runs up from zero to its value.
// - cascade: a set of tiles (covers, list rows) lands one after another, in
//   reading order, as each batch comes into view.
// Both do nothing when motion is off (reduced motion, or no .motion on html).
// ---------------------------------------------------------------------------
import { gsap, ScrollTrigger, reduceMotion } from './motion';

/** Target time from the first tile starting to the last (s); long grids take longer, so few tiles move at once. */
const SPREAD = 1;
/** Matches the soft landing in Layout.astro, so a row and its contents start together. */
const START = 'top 92%';

const motionOn = () => !reduceMotion() && document.documentElement.classList.contains('motion');

/** Count a number like "1,234" or "4.1" up from zero, keeping its format. */
export function countUp(els: Iterable<HTMLElement>) {
  if (!motionOn()) return;
  for (const el of els) {
    const raw = el.textContent?.trim() ?? '';
    const m = raw.match(/^\d[\d,]*(\.\d+)?$/);
    if (!m) continue;
    const target = Number(raw.replace(/,/g, ''));
    const decimals = m[1] ? m[1].length - 1 : 0;
    const fmt = (v: number) =>
      v.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
    // Screen readers get the real value, not the ticking one.
    el.setAttribute('aria-label', raw);
    el.textContent = fmt(0);
    // Bigger numbers get a little longer, so 9 and 119,667 both read as one
    // smooth run that slows into place instead of 9 even clicks.
    const duration = 1 + Math.min(1, Math.log10(target + 1) / 5);
    const o = { v: 0 };
    let shown = fmt(0);
    ScrollTrigger.create({
      trigger: el, start: START, once: true,
      onEnter: () => gsap.to(o, {
        v: target, duration, delay: 0.15, ease: 'expo.out',
        onUpdate: () => {
          const next = fmt(decimals ? o.v : Math.round(o.v));
          // Only touch the DOM when the digits change: fewer layouts per frame.
          if (next !== shown) el.textContent = shown = next;
        },
        onComplete: () => { el.textContent = raw; },
      }),
    });
  }
}

/** Tiles land one after another as they come into view. */
export function cascade(items: HTMLElement[]) {
  if (!motionOn() || !items.length) return;
  // Opacity only (not visibility), so a hidden link can still take focus;
  // focusing it scrolls it into view, which plays its batch.
  gsap.set(items, { opacity: 0, y: 10 });
  ScrollTrigger.batch(items, {
    start: START, once: true,
    onEnter: (batch) => {
      const els = (batch as HTMLElement[]).sort((a, b) => items.indexOf(a) - items.indexOf(b));
      // Each tile on its own compositor layer while it moves, so the grayscale
      // covers aren't repainted every frame; dropped again once landed.
      gsap.set(els, { willChange: 'opacity, transform' });
      gsap.to(els, {
        opacity: 1, y: 0, duration: 0.5, delay: 0.1, force3D: true,
        // Spread wide enough that only a handful of tiles move at once.
        stagger: Math.max(0.05, Math.min(0.08, SPREAD / els.length)),
        clearProps: 'opacity,transform,willChange',
      });
    },
  });
}
