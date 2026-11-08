// ---------------------------------------------------------------------------
// One place to get GSAP from, with ScrollTrigger registered. Every scroll
// animation on the site (soft landing, chart reveals, scrollies) goes through
// this, so they share GSAP's single ticker and scroll handling instead of
// each running its own requestAnimationFrame loop.
// ---------------------------------------------------------------------------
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// ScrollTrigger measures where each trigger starts once. Charts drawing in,
// images loading and fonts swapping change the page height afterwards, which
// would leave those positions stale (a chart cascading while still below the
// screen). Re-measure whenever the page height settles on a new value.
let lastHeight = 0;
let pending = 0;
new ResizeObserver(() => {
  const h = document.documentElement.scrollHeight;
  if (h === lastHeight) return;
  lastHeight = h;
  clearTimeout(pending);
  pending = window.setTimeout(() => ScrollTrigger.refresh(), 100);
}).observe(document.body);

export const reduceMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
export { gsap, ScrollTrigger };
