# Publication PDFs

Drop a paper's PDF here to host it on the site and get an automatic first-page
thumbnail on `/pubs/`.

## Steps

1. **Add the PDF** to this folder. Name it after the publication's Markdown file
   so everything lines up, e.g. `2024-playing-with-fire.pdf` for
   `src/content/publications/2024-playing-with-fire.md`.

2. **Point the frontmatter at it** — add one line to that publication:

   ```yaml
   file: 2024-playing-with-fire.pdf
   ```

   This renders a **PDF** button linking to the copy hosted here. Keep the
   existing `links:` (`arxiv`, `doi`, `url`, …) for the canonical online version —
   they still show as their own buttons.

3. **Generate the thumbnail:**

   ```bash
   npm run thumbs            # or: python3 scripts/build_thumbs.py
   ```

   This writes `thumbs/<slug>.png`. First run needs the dependency:
   `pip install -r requirements.txt`.

4. **Commit** the PDF and the generated `thumbs/<slug>.png`. (GitHub Pages builds
   with Node only, so thumbnails must be committed, not built in CI.)

## Fixing a bad thumbnail

The generator never overwrites an existing thumbnail, so you can just **replace**
`thumbs/<slug>.png` with your own image. For a permanent, separately-named
override, set `thumb:` in the publication's frontmatter instead, e.g.
`thumb: papers/thumbs/2024-playing-with-fire-custom.png`.

Re-run with `--force` to regenerate everything from the PDFs (this *does* clobber
hand-replaced `thumbs/<slug>.png` files).
