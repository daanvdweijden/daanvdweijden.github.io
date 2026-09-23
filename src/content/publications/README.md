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
note: "Equal Author Contribution" # optional — a short italic highlight
award: "Best Paper Award"     # optional — a prize, rendered as a gold badge
summary: >-                   # optional — 1–3 plain-language sentences, no jargon
  What the paper shows, for a non-specialist.
keyFindings:                  # optional — standalone claim sentences
  - "X improves Y by Z% on W."
file: 2024-emnlp-retrieval.pdf # optional — a PDF you host on the site (see below)
# thumb: papers/thumbs/custom.png  # optional — manual thumbnail override
links:                        # optional — every entry becomes a button
  pdf: https://.../paper.pdf
  arxiv: https://arxiv.org/abs/0000.00000
  doi: 10.1000/xyz123         # bare DOI (no https://) — linked automatically
  code: https://github.com/...
  data: https://zenodo.org/... # dataset
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
| `note`        |          | Short italic highlight, e.g. "Equal Author Contribution".    |
| `award`       |          | A prize or honor, e.g. "Best Poster Honorable Mention" — shown as a gold badge (list, paper page, tooltip, cover ribbon), distinct from `note`. |
| `summary`     |          | Plain-language summary. Shown as "In short" on the paper page, used as the search/share snippet, the JSON-LD `description` and the paper's line in `/llms.txt`. |
| `keyFindings` |          | List of claim sentences, shown as "Key findings". Write each so it makes sense quoted on its own. |
| `file`        |          | Filename of a PDF hosted on the site (see below).            |
| `thumb`       |          | Manual thumbnail override, a path under `public/`.           |
| `links.*`     |          | `pdf`, `arxiv`, `doi`, `code`, `data`, `slides`, `poster`, `video`, `url`. Order fixed. |
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

## Discoverability metadata (automatic)

Every paper page gets, from the frontmatter alone: Google Scholar
`citation_*` tags (Scholar indexes the hosted PDF via `citation_pdf_url`),
`ScholarlyArticle` JSON-LD, a canonical URL, and Open Graph / Twitter preview
tags using the thumbnail. Papers also appear in `/sitemap-index.xml` and
`/llms.txt`. Keep `type` accurate: "Journal article" → journal tag,
"… report" → institution tag, anything else → conference tag.
