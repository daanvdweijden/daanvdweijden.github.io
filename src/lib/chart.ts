// ---------------------------------------------------------------------------
// Shared chart vocabulary for notes. A note's charts live in its own
// src/content/notes/<slug>/charts.ts as named functions:
//
//   export const myChart: ChartFn<Row[]> = (data, ctx) =>
//     Plot.plot({ ...base(ctx), marks: [ ... ] });
//
// and are placed in the text with <Chart name="myChart" data={rows} />.
// The runtime (Chart.astro) calls the function in the browser, and calls it
// again when the width, the colour scheme or the scrolly step changes, so a
// chart is just "data + context → SVG".
//
// The house style: everything grey, the one thing the sentence is about in
// --accent; --accent-2 (rust) when a chart needs a contrast. Axes are muted, so they recede.
// ---------------------------------------------------------------------------
import type { PlotOptions } from '@observablehq/plot';

export interface ChartColors {
  ink: string;
  muted: string;
  line: string;
  bg: string;
  accent: string;
  /** Second colour, for a contrast with the accent (rust; --accent-2 or --p-red-fg). */
  accent2: string;
  /** Extra hues for charts that need more than two categories (blue, yellow, green). */
  extra: string[];
  /** De-emphasised marks: the "everything else" grey. */
  faint: string;
}

export interface ChartContext {
  /** Width of the chart's box, in px. */
  width: number;
  /** Active step inside a <Scrolly> (0-based); 0 outside one. */
  step: number;
  colors: ChartColors;
  font: string;
  dark: boolean;
  /** The chart's container, for charts that want to add their own DOM. */
  el: HTMLElement;
}

export type ChartFn<T = any> = (data: T, ctx: ChartContext) => Element | Promise<Element>;

/** Resolves a CSS colour expression (vars, color-mix) to a concrete colour. */
function resolve(el: HTMLElement, expr: string): string {
  const probe = document.createElement('span');
  probe.style.color = expr;
  probe.style.display = 'none';
  el.append(probe);
  const c = getComputedStyle(probe).color;
  probe.remove();
  return c;
}

export function readTheme(el: HTMLElement): Pick<ChartContext, 'colors' | 'font' | 'dark'> {
  const v = (name: string) => resolve(el, `var(${name})`);
  const cs = getComputedStyle(document.documentElement);
  return {
    colors: {
      ink: v('--ink'),
      muted: v('--muted'),
      line: v('--line'),
      bg: v('--bg'),
      accent: v('--accent'),
      accent2: resolve(el, 'var(--accent-2, var(--p-red-fg))'),
      extra: [v('--p-blue-fg'), v('--p-yellow-fg'), v('--p-green-fg')],
      faint: resolve(el, 'color-mix(in srgb, var(--muted) 45%, var(--bg))'),
    },
    font: cs.getPropertyValue('--font').trim() || 'sans-serif',
    dark: cs.colorScheme.includes('dark'),
  };
}

/** Plot options every chart starts from: size, type, quiet axes. */
export function base(ctx: ChartContext, height?: number): PlotOptions {
  return {
    width: ctx.width,
    height,
    marginLeft: 44,
    style: {
      fontFamily: ctx.font,
      fontSize: '13px',
      color: ctx.colors.muted,
      background: 'transparent',
      overflow: 'visible',
    },
  };
}
