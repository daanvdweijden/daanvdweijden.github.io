// Charts for this note. Each export is one chart: (data, ctx) → SVG element.
// Placed in index.mdx with <Chart name="concentration" data={artists} />.
import * as Plot from '@observablehq/plot';
import { base, type ChartFn } from '../../../lib/chart';

type Artist = { rank: number; plays: number; share: number };
type Year = { year: number; artists: number };

/** Cumulative share of plays by artist rank, top 10 in the accent colour. */
export const concentration: ChartFn<Artist[]> = (data, ctx) => {
  const top = data.filter((d) => d.rank <= 10);
  return Plot.plot({
    ...base(ctx, 300),
    x: { label: 'Artists, most played first →', type: 'log', domain: [1, 200] },
    y: { label: '↑ Share of all plays', percent: true, domain: [0, 100], grid: true },
    marks: [
      Plot.ruleY([0], { stroke: ctx.colors.line }),
      Plot.line(data, { x: 'rank', y: 'share', stroke: ctx.colors.faint, strokeWidth: 2 }),
      Plot.line(top, { x: 'rank', y: 'share', stroke: ctx.colors.accent, strokeWidth: 3 }),
      Plot.dot(top.slice(-1), { x: 'rank', y: 'share', fill: ctx.colors.accent, r: 4 }),
      Plot.text(top.slice(-1), {
        x: 'rank', y: 'share', dx: 8, textAnchor: 'start', fill: ctx.colors.ink,
        text: (d) => `Top 10: ${Math.round(d.share * 100)}%`,
      }),
      // Hover anywhere for the exact value.
      Plot.tip(data, Plot.pointerX({
        x: 'rank', y: 'share',
        title: (d) => `Top ${d.rank} artists\n${(d.share * 100).toFixed(1)}% of plays`,
      })),
    ],
  });
};

/** Distinct artists per year. Each scrolly step highlights something else. */
export const yearly: ChartFn<Year[]> = (data, ctx) => {
  const focus = [null, 2020, 'after'][ctx.step] ?? null;
  const isOn = (d: Year) => (focus === 'after' ? d.year >= 2020 : d.year === focus);
  return Plot.plot({
    ...base(ctx, 360),
    x: { type: 'band', label: null },
    y: { label: '↑ Distinct artists', grid: true, domain: [0, 450] },
    marks: [
      Plot.ruleY([0], { stroke: ctx.colors.line }),
      Plot.barY(data, {
        x: 'year', y: 'artists', inset: 3,
        fill: (d) => (focus !== null && isOn(d) ? ctx.colors.accent : ctx.colors.faint),
      }),
      Plot.text(data.filter((d) => focus !== null && isOn(d)), {
        x: 'year', y: 'artists', dy: -8, text: 'artists', fill: ctx.colors.ink,
      }),
    ],
  });
};
