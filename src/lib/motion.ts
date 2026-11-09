// ---------------------------------------------------------------------------
// One place to get GSAP from, with ScrollTrigger registered. Every scroll
// animation on the site (soft landing, chart reveals, scrollies) goes through
// this, so they share GSAP's single ticker and scroll handling instead of
// each running its own requestAnimationFrame loop.
// ---------------------------------------------------------------------------
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollSmoother } from 'gsap/ScrollSmoother';

gsap.registerPlugin(ScrollTrigger, ScrollSmoother);

// Smooth scroll: the page glides to where the wheel sends it. Only where the
// head script (Layout.astro) set html.smooth: motion allowed and a mouse or
// trackpad; touch screens keep native scrolling. Created here, the first
// thing any scroll script imports, because ScrollTriggers (the scrolly's pin
// especially) must be made after the smoother to work with it. The
// #smooth-wrapper/#smooth-content elements are in Layout.astro.
const root = document.documentElement;
if (window.innerHeight === 0) root.classList.remove('smooth');
if (root.classList.contains('smooth') && document.getElementById('smooth-content')) {
  ScrollSmoother.create({
    wrapper: '#smooth-wrapper',
    content: '#smooth-content',
    smooth: 1,        // seconds to catch up with the wheel; higher = floatier
    effects: false,   // no data-speed/data-lag parallax
    smoothTouch: false,
  });
} else {
  root.classList.remove('smooth');
}

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
