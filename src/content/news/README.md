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
draft: false               # set true to hide while you write it
---

The body goes here (this is the Markdown body). It is rendered on the item's
own page and supports **Markdown**: emphasis, links, lists, paragraphs.
```

## Field reference

| Field   | Required | Notes                                              |
| ------- | :------: | --------------------------------------------------- |
| `title` |    ✓     | Headline shown on the list, home feed, and page.    |
| `date`  |    ✓     | `YYYY-MM-DD`; drives sort order and year grouping.  |
| `tag`   |          | Free text badge, e.g. "conference", "award".        |
| `draft` |          | `true` hides the item everywhere.                   |

The **body** below the frontmatter is shown on the item's own page.
