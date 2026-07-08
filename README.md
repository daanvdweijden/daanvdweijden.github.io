# Personal site (Astro scaffold)

A minimal, theme-free starting point. The plumbing for content is in place;
the design is intentionally blank so we can build each element from a moodboard.

## Run it

```bash
npm install
npm run dev      # http://localhost:4321
```

## Where the content lives (the only things you edit regularly)

| What | File |
| --- | --- |
| Your name, role, links | `src/site.config.ts` |
| Publications | `src/data/publications.bib` (paste BibTeX, newest shown first) |
| News / announcements | `src/content/news/*.md` (one file per item) |
| CV (education, work, awards) | `src/data/resume.json` ([JSON Resume](https://jsonresume.org/schema/) schema — portable to other JSON Resume tools/themes too) |

## Where the design will live

- `src/layouts/Base.astro` — page shell + global styles (currently a bare reset)
- `src/pages/index.astro` — homepage layout (currently plain placeholders)
- `src/components/` — custom elements we build per the moodboard (empty for now)

Nothing in the content layer changes when we restyle. Add a paper or a news
item any time without touching code.

## Puzzle data (activity wall)

`data/activity.json` (plus the per-source CSVs alongside it) feeds a daily
puzzle-solving activity wall. It's kept up to date by
`.github/workflows/puzzle-data.yml`, which runs 6×/day:

1. Checks out the fetcher code fresh from two public repos (no vendoring,
   nothing from them gets committed here — just their output):
   [nyt-games-tracker](https://github.com/daanvdweijden/nyt-games-tracker)
   and [nrc-puzzel-tracker](https://github.com/daanvdweijden/nrc-puzzel-tracker).
2. Runs each fetcher with `--output` pointed at this repo's `data/`.
3. Runs `scripts/build_feed.py` to merge everything into `data/activity.json`.
4. Commits the result back to this repo.

Requires three repo secrets (Settings → Secrets and variables → Actions):
`NYT_S_COOKIE`, `NRC_PLAYER_ID`, `NRC_USER_ID` — see the two repos above for
how to get them.

To run the fetchers locally: `pip install -r requirements.txt`, copy
`.env.example` to `.env` and fill it in, then run whichever fetcher script
you need directly (from wherever you've cloned those two repos) with
`--output` pointed at this repo's `data/`, followed by
`python scripts/build_feed.py`.
