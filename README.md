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

**It does not live on `main`.** The fetchers run hourly, so keeping their
output in `main` buried the real history under "Update puzzle data" commits.
Instead the files sit at the root of a dedicated **`puzzle-data` orphan
branch**, and `main` gitignores `data/`. Both workflows check that branch out
into `data/` before they need it, so every path in the code stayed the same —
`src/lib/puzzles.ts` still reads `data/*.csv` at build time and the page is
still fully static, no client-side fetching.

Locally, `npm run data:pull` sets `data/` up as a git worktree on that branch
(and fast-forwards it on later runs). Without it the `/puzzles` page can't
build.

`.github/workflows/puzzle-data.yml` runs hourly (at :45) and:

1. Checks out the fetcher code fresh from two public repos (no vendoring,
   nothing from them gets committed anywhere — just their output):
   [nyt-games-tracker](https://github.com/daanvdweijden/nyt-games-tracker)
   and [nrc-puzzel-tracker](https://github.com/daanvdweijden/nrc-puzzel-tracker).
   The Minute Cryptic fetcher lives here, in `scripts/fetch_minutecryptic.py`.
2. Runs each fetcher with `--output` pointed at `data/`.
3. Runs `scripts/build_feed.py` to merge everything into `data/activity.json`.
4. Commits the result to the `puzzle-data` branch.
5. Explicitly dispatches `deploy.yml` to rebuild the site with the new data.

Requires these repo secrets (Settings → Secrets and variables → Actions):
`NYT_S_COOKIE`, `NRC_PLAYER_ID`, `NRC_USER_ID` — see the two repos above for
how to get them — plus `MC_REFRESH_TOKEN` and `MC_SECRETS_PAT` for Minute
Cryptic (below).

### Minute Cryptic

Minute Cryptic signs in through Supabase (Google / magic link), so there's no
fixed cookie: each run trades `MC_REFRESH_TOKEN` for a fresh session and a
**new** refresh token, then writes that new token back into the secret. Writing
secrets needs `MC_SECRETS_PAT` — a fine-grained personal access token
(github.com/settings/personal-access-tokens/new) scoped to this repo only, with
the repository permission **Secrets: Read and write**.

To seed (or re-seed after the alert email) `MC_REFRESH_TOKEN`:

1. Open minutecryptic.com in a **private window** and sign in. That makes a
   separate session for CI, so your normal browser doesn't fight it over the
   token.
2. In that window's DevTools console, copy the refresh token to the clipboard:
   ```js
   copy(JSON.parse(atob(document.cookie.split('; ').filter(c => c.startsWith('sb-pubnjtzifbxpdxwnmvhm-auth-token')).sort().map(c => c.split('=')[1]).join('').slice(7).replace(/-/g, '+').replace(/_/g, '/'))).refresh_token)
   ```
3. Run `gh secret set MC_REFRESH_TOKEN` and paste it at the prompt.
4. Close the private window. **Don't click "sign out"** there (or anywhere —
   Supabase's default sign-out ends every session, CI's included).
5. Actions → Puzzle data → Run workflow, to check it.

Running `scripts/fetch_minutecryptic.py` locally spends the token CI holds, so
either re-seed afterwards or use a different session for local runs.

To run the fetchers locally: `pip install -r requirements.txt`, copy
`.env.example` to `.env` and fill it in, then run whichever fetcher script
you need directly (from wherever you've cloned those two repos) with
`--output` pointed at this repo's `data/`, followed by
`python scripts/build_feed.py`. Since `data/` is a worktree on the
`puzzle-data` branch, commit any local results from inside it
(`git -C data commit ...`).

## Books cache

`/books` reads the Goodreads RSS feed at build time. That feed is flaky — rate
limits, 5xx, and the occasional valid-but-empty shelf — and any of those used
to blank the page until the next deploy.

So `src/lib/books.ts` snapshots every good fetch to `data/books.json` and falls
back to it when the feed misbehaves (an empty shelf counts as misbehaving; the
read shelf is never legitimately empty). It rides on the **`puzzle-data`
branch** with the puzzle data, for the same reason — a snapshot commit per
finished book shouldn't clutter `main`. `deploy.yml` pushes the refreshed file
back after each build, and that step is `continue-on-error`: a stale snapshot
beats a skipped deploy.

A fresh clone that skips `npm run data:pull` has no snapshot, so a failing feed
there renders `/books` empty — same as before. Local builds write the file into
the worktree; leave it uncommitted unless you want to seed the branch by hand.
