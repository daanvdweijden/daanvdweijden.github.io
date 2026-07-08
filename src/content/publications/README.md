# Adding a publication

Each paper is one Markdown file in this folder. Drop a new `.md` file here and
it appears automatically on `/pubs/` (grouped by year) with its own page at
`/pubs/<filename>/`. No code changes needed.

The **filename** (without `.md`) becomes the URL slug and the BibTeX key —
use something stable like `2024-emnlp-retrieval.md`.

> Note: this `README.md` has no frontmatter, so it is skipped by the site — it
> is documentation only.

## Template

Copy this into a new file and edit:

```markdown
---
title: "Your paper title"
authors:
  - Daan van der Weijden      # your name is auto-bolded in author lists
  - Co Author
date: 2024-06-01              # publication date; the year is derived from this
venue: "Full Venue Name (ACRONYM)"
venueShort: ACRONYM           # optional — the small badge on the list
type: Conference paper        # optional — e.g. "Journal article", "Workshop paper"
note: "Best paper"            # optional — a short highlight
file: 2024-emnlp-retrieval.pdf # optional — a PDF you host on the site (see below)
# thumb: papers/thumbs/custom.png  # optional — manual thumbnail override
links:                        # optional — every entry becomes a button
  pdf: https://.../paper.pdf
  arxiv: https://arxiv.org/abs/0000.00000
  doi: 10.1000/xyz123         # bare DOI (no https://) — linked automatically
  code: https://github.com/...
  slides: https://.../slides.pdf
  poster: https://.../poster.pdf
  video: https://youtu.be/...
  url: https://...            # any other canonical link
# bibtex: |                   # optional — omit and one is generated for you
#   @article{key, ... }
featured: false               # optional
draft: false                  # set true to hide while you write it
---

The abstract goes here (this is the Markdown body). It is rendered on the
paper's own page and supports **Markdown**: emphasis, links, lists, paragraphs.
```

## Field reference

| Field         | Required | Notes                                                        |
| ------------- | :------: | ------------------------------------------------------------ |
| `title`       |    ✓     | Paper title.                                                 |
| `authors`     |    ✓     | List of full names; your own name is emphasised.             |
| `date`        |    ✓     | `YYYY-MM-DD`; the year drives the grouping.                  |
| `venue`       |    ✓     | Full venue name.                                             |
| `venueShort`  |          | Short badge shown on the list (defaults to nothing).         |
| `type`        |          | Free text, e.g. "Journal article".                           |
| `note`        |          | Short highlight, e.g. "Best paper".                          |
| `file`        |          | Filename of a PDF hosted on the site (see below).            |
| `thumb`       |          | Manual thumbnail override, a path under `public/`.           |
| `links.*`     |          | `pdf`, `arxiv`, `doi`, `code`, `slides`, `poster`, `video`, `url`. Order fixed. |
| `bibtex`      |          | Raw BibTeX. If omitted, one is generated from the fields.    |
| `featured`    |          | Reserved for later (e.g. highlighting on the home page).     |
| `draft`       |          | `true` hides the paper everywhere.                           |

The **body** below the frontmatter is the abstract shown on the paper page.

## Hosting the PDF + first-page thumbnail

Set `file:` to a PDF you drop in [`public/papers/`](../../../public/papers/) —
e.g. `file: 2024-emnlp-retrieval.pdf`. That adds a **PDF** button pointing at the
copy hosted here (your `links.arxiv` / `doi` / `url` still link out to the
canonical online version), and gives the paper a first-page thumbnail on `/pubs/`.

Generate the thumbnails with `npm run thumbs` and commit the PDF plus the
generated `public/papers/thumbs/<slug>.png`. See
[`public/papers/README.md`](../../../public/papers/README.md) for the full
workflow, including how to replace an auto thumbnail that doesn't look right.
