# Adding a news item

Each item is one Markdown file in this folder. Drop a new `.md` file here and
it appears automatically on `/news/` (grouped by year) with its own page at
`/news/<filename>/`, and on the home page feed. No code changes needed.

The **filename** (without `.md`) becomes the URL slug — use something stable
like `2024-06-01-some-event.md`.

> Note: this `README.md` has no frontmatter, so it is skipped by the site — it
> is documentation only.

## Template

Copy this into a new file and edit:

```markdown
---
title: "Short, specific headline"
date: 2024-06-01          # drives sort order and year grouping
tag: conference            # optional — e.g. "conference", "publication", "award"
emphasis: "specific headline"  # optional — substring of title, highlighted in lists only
draft: false               # set true to hide while you write it
---

The body goes here (this is the Markdown body). It is rendered on the item's
own page and supports **Markdown**: emphasis, links, lists, paragraphs.
```

## Field reference

| Field   | Required | Notes                                              |
| ------- | :------: | --------------------------------------------------- |
| `title`      |    ✓     | Headline shown on the list, home feed, and page.    |
| `date`       |    ✓     | `YYYY-MM-DD`; drives sort order and year grouping.  |
| `tag`        |          | Free text badge. Keep to the house set: `publication`, `award`, `talk`, `milestone`. |
| `emphasis`   |          | Substring of `title` to highlight — shown on the home feed and `/news/` list, but not on the item's own page. Must match part of `title` exactly. |
| `draft`      |          | `true` hides the item everywhere.                   |

The **body** below the frontmatter is shown on the item's own page.

## Images

Images go in the body, so they show on the item's own page only — the `/news/`
list and the home feed stay text. Drop the file in `public/news/` and reference
it with a root-absolute path:

```markdown
![Poster session at CUI '26](/news/2026-cui-poster.jpg)
```

For a caption, use raw HTML (Markdown files accept it):

```html
<figure>
  <img src="/news/2026-cui-poster.jpg" alt="Poster session at CUI '26" />
  <figcaption>Presenting the engagement typology poster in Bremen.</figcaption>
</figure>
```

Both are styled in `src/pages/news/[id].astro` — full width of the text column,
rounded corners, muted caption. Resize photos to ~1600px wide before committing;
files under `public/` are served as-is, with no build-time optimization.
