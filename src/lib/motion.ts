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

// Frame-rate check. Smooth scroll moves the page with JavaScript, so it is
// only as fluid as requestAnimationFrame. When the browser throttles that
// (Safari in Low Power Mode drops to 30fps, a stuck background-tab throttle),
// the glide turns choppy and native scrolling is better. Measured on every
// page once it has settled; the result is remembered per device and read by
// the head script in Layout.astro, so the next page decides before any script
// runs. It re-checks every page, so a device that speeds up again gets the
// smooth scroll back. Native scroll doesn't change the frame rate, so the check
// works with the smoother on or off.
const SLOW_KEY = 'smooth-slow';
function measureFrames() {
  if (document.hidden || window.innerHeight === 0) return;
  const gaps: number[] = [];
  let last = 0;
  const start = performance.now();
  const tick = (t: number) => {
    if (last) gaps.push(t - last);
    last = t;
    if (t - start < 600) return requestAnimationFrame(tick);
    if (document.hidden || gaps.length < 5) return; // tab left mid-check: no verdict
    gaps.sort((a, b) => a - b);
    const median = gaps[gaps.length >> 1];
    const slow = median > 1000 / 45; // below ~45fps: 30fps throttle or worse
    try {
      if (slow) localStorage.setItem(SLOW_KEY, '1');
      else localStorage.removeItem(SLOW_KEY);
    } catch {}
  };
  requestAnimationFrame(tick);
}
// After load and a quiet moment, so charts drawing in don't count as slow.
const afterLoad = () => setTimeout(measureFrames, 1500);
if (document.readyState === 'complete') afterLoad();
else window.addEventListener('load', afterLoad, { once: true });

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
