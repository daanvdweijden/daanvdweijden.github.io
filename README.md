# Personal site (Astro scaffold)

A minimal, theme-free starting point. The plumbing for content is in place;
the design is intentionally blank so we can build each element from a moodboard.

## Run it

```bash
npm install
npm run data:pull   # puzzle data — see below; only needed once per clone
npm run dev         # http://localhost:4321
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
puzzle-solving activity wall.

**It does not live on `main`.** The fetchers run 6×/day, so keeping their
output in `main` buried the real history under "Update puzzle data" commits.
Instead the files sit at the root of a dedicated **`puzzle-data` orphan
branch**, and `main` gitignores `data/`. Both workflows check that branch out
into `data/` before they need it, so every path in the code stayed the same —
`src/lib/puzzles.ts` still reads `data/*.csv` at build time and the page is
still fully static, no client-side fetching.

Locally, `npm run data:pull` sets `data/` up as a git worktree on that branch
(and fast-forwards it on later runs). Without it the `/puzzles` page can't
build.

`.github/workflows/puzzle-data.yml` runs 6×/day and:

1. Checks out the fetcher code fresh from two public repos (no vendoring,
   nothing from them gets committed anywhere — just their output):
   [nyt-games-tracker](https://github.com/daanvdweijden/nyt-games-tracker)
   and [nrc-puzzel-tracker](https://github.com/daanvdweijden/nrc-puzzel-tracker).
2. Runs each fetcher with `--output` pointed at `data/`.
3. Runs `scripts/build_feed.py` to merge everything into `data/activity.json`.
4. Commits the result to the `puzzle-data` branch.
5. Explicitly dispatches `deploy.yml` to rebuild the site with the new data.

Requires three repo secrets (Settings → Secrets and variables → Actions):
`NYT_S_COOKIE`, `NRC_PLAYER_ID`, `NRC_USER_ID` — see the two repos above for
how to get them.

To run the fetchers locally: `pip install -r requirements.txt`, copy
`.env.example` to `.env` and fill it in, then run whichever fetcher script
you need directly (from wherever you've cloned those two repos) with
`--output` pointed at this repo's `data/`, followed by
`python scripts/build_feed.py`. Since `data/` is a worktree on the
`puzzle-data` branch, commit any local results from inside it
(`git -C data commit ...`).
