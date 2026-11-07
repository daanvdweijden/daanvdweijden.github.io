# Notes

Longer, data-driven pieces about small hyperfixations. Each note is a folder:

```
src/content/notes/<slug>/      ← folder name = URL (/notes/<slug>/)
  index.mdx                    ← the text
  charts.ts                    ← the chart functions for this note
  data/*.json                  ← small, cleaned data (pre-aggregated)
  img/                         ← images
```

The messy part (raw data, exploration notebooks, link dumps) lives in the
workshop at `~/Documents/Personal/blog/<topic>/` and never comes here. Only
the cleaned data the charts need is copied over.

`example/` is a working demo of every component. It is `draft: true` forever,
so it only shows up in `npm run dev`: open http://localhost:4321/notes/example/.

## Starting a note

1. Copy `example/` to a new folder, e.g. `music-diversity/`.
2. Replace the data, the chart functions and the text.
3. Run `npm run dev`. Drafts are listed on `/notes/` with a "Draft" label.
4. When you like it, set `draft: false`. The note is built, and "Notes" appears
   in the site menu by itself once there is at least one published note.

Folders starting with `_` are ignored, so `_scratch/` is fine for experiments.

## Frontmatter

```yaml
title: "Short title"
dek: "One sentence under the title: the hook or the question."  # optional
date: 2026-11-05
updated: 2026-12-01      # optional
tags: [music, data]      # optional
draft: true              # default true; drafts never get built
unlisted: true           # optional: live at its URL, but not in the nav, the notes list or the sitemap (noindex)
```

## Components

Import them at the top of `index.mdx` (see the example).

| Component | What it's for |
| --- | --- |
| `<Figure title subtitle caption source sourceUrl width>` | Frame around a chart or image. **Title = the finding**, as a sentence. `width="wide"` (default) spans both columns, `"text"` stays in the text column. |
| `<Chart name data height alt>` | Renders `export const <name>` from this note's `charts.ts` in the browser, with `data` passed in. Redrawn on resize, theme switch and scrolly step. |
| `<Aside>` | Margin note in the left column. Put it right **before** the paragraph it belongs to. |
| `<Mark type>` | Hand-drawn highlight on a phrase when scrolled into view (`highlight`, `underline`, `circle`, `box`). Once or twice per note. |
| `<Scrolly>` + `<Step>` | Sticky chart with text steps scrolling past. The active step is `ctx.step` in the chart function. For the one showpiece. |

## Writing a chart

```ts
import * as Plot from '@observablehq/plot';
import { base, type ChartFn } from '../../../lib/chart';

export const myChart: ChartFn<Row[]> = (data, ctx) =>
  Plot.plot({
    ...base(ctx, 300),               // width, font, muted axes; 300 = height
    marks: [
      Plot.line(data, { x: 'x', y: 'y', stroke: ctx.colors.faint }),   // everything else
      Plot.line(data.filter(isTheStory), { x: 'x', y: 'y', stroke: ctx.colors.accent }), // the point
      Plot.tip(data, Plot.pointerX({ x: 'x', y: 'y' })),                // hover values
    ],
  });
```

`ctx` gives you `width`, `step`, `dark`, and `colors` (`ink`, `muted`, `line`,
`bg`, `accent`, `faint`) read from the site's CSS, so charts follow the
light/dark switch. Plot docs: https://observablehq.com/plot/

House style: grey (`faint`) for everything, `accent` only for what the
sentence is about, axes quiet. Keep inlined data small (well under ~100 KB).
