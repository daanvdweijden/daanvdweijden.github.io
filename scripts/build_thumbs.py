#!/usr/bin/env python3
"""
Generate thumbnails for publication PDFs.
------------------------------------------
Renders page 1 (or --page N) of every PDF in public/papers/ to a JPG in
public/papers/thumbs/, named after the PDF (2024-foo.pdf -> thumbs/2024-foo.jpg).
The website picks the thumbnail up automatically for any publication whose
`file:` frontmatter points at that PDF (see src/lib/pubs.ts -> thumbSrc).

Workflow:
  1. Drop <slug>.pdf into public/papers/  (slug usually matches the .md filename)
  2. Add `file: <slug>.pdf` to the publication's frontmatter
  3. Run this script:  python3 scripts/build_thumbs.py
  4. Commit the PDF and the generated thumbs/<slug>.jpg

It also writes a wide link-preview image (2400×1260, the 1.91:1 crop LinkedIn,
Bluesky and Slack show) to public/papers/og/<slug>.jpg: the top of page 1, so
the title and authors, rendered sharp. Paper pages use it automatically as
their og:image; an `ogImage:` frontmatter path overrides it.

Existing thumbnails are left untouched, so if an auto thumbnail looks wrong you
can simply replace public/papers/thumbs/<slug>.jpg with your own image and it
will survive future runs. Use --force to regenerate everything, or point the
publication's `thumb:` frontmatter at a separate hand-made image for a permanent
override.

Requires PyMuPDF:  pip install -r requirements.txt   (or: pip install PyMuPDF)
"""

import argparse
import os
import sys

try:
    import pymupdf as fitz  # PyMuPDF >= 1.24 exposes the `pymupdf` name
except ImportError:
    try:
        import fitz  # older PyMuPDF
    except ImportError:
        sys.exit(
            "PyMuPDF is required. Install it with:\n"
            "  pip install -r requirements.txt   (or: pip install PyMuPDF)"
        )

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def render_page(pdf_path: str, out_path: str, width: int, page_number: int) -> None:
    """Render `page_number` (1-indexed) of pdf_path to a `width`px-wide JPG at out_path."""
    doc = fitz.open(pdf_path)
    try:
        if doc.page_count == 0:
            raise ValueError("PDF has no pages")
        if page_number < 1 or page_number > doc.page_count:
            raise ValueError(f"page {page_number} out of range (PDF has {doc.page_count} pages)")
        page = doc.load_page(page_number - 1)
        # Render directly at the target width (crisp, antialiased) rather than
        # rendering large and downscaling.
        zoom = width / page.rect.width
        pix = page.get_pixmap(matrix=fitz.Matrix(zoom, zoom), alpha=False)
        pix.save(out_path)
    finally:
        doc.close()


OG_WIDTH, OG_HEIGHT = 2400, 1260
# PDFs whose page 1 is a repository cover sheet: the page (1-indexed) with the
# paper's real title block, used for the link preview.
OG_PAGE = {"2024-playing-with-fire": 2}


def render_og(pdf_path: str, out_path: str, page_number: int = 1) -> None:
    """Render the top of the title page (title, authors, start of the text) as a wide preview."""
    doc = fitz.open(pdf_path)
    try:
        page = doc.load_page(page_number - 1)
        # Horizontal text lines only, so arXiv's sideways margin stamp doesn't
        # widen the crop.
        boxes = [
            line["bbox"]
            for block in page.get_text("dict")["blocks"]
            for line in block.get("lines", [])
            if abs(line["dir"][1]) < 0.01 and "".join(sp["text"] for sp in line["spans"]).strip()
        ]
        if boxes:
            x0 = min(b[0] for b in boxes)
            x1 = max(b[2] for b in boxes)
            y0 = min(b[1] for b in boxes)
        else:  # scanned page without a text layer: the full width, from the top
            x0, x1, y0 = 0, page.rect.width, 0.04 * page.rect.height
        pad = 0.04 * (x1 - x0) if boxes else 0
        x0, x1, y0 = max(0, x0 - pad), min(page.rect.width, x1 + pad), max(0, y0 - 1.5 * pad)
        clip = fitz.Rect(x0, y0, x1, y0 + (x1 - x0) * OG_HEIGHT / OG_WIDTH)
        zoom = OG_WIDTH / clip.width
        pix = page.get_pixmap(matrix=fitz.Matrix(zoom, zoom), clip=clip, alpha=False)
        pix.pil_save(out_path, quality=88, optimize=True) if hasattr(pix, "pil_save") else pix.save(out_path)
    finally:
        doc.close()


def main() -> None:
    ap = argparse.ArgumentParser(description="Generate first-page PDF thumbnails.")
    ap.add_argument(
        "--papers-dir",
        default=os.path.join(ROOT, "public", "papers"),
        help="folder holding the source PDFs (default: public/papers)",
    )
    ap.add_argument(
        "--width", type=int, default=320,
        help="output thumbnail width in pixels (default: 320)",
    )
    ap.add_argument(
        "--page", type=int, default=1,
        help="1-indexed page to render (default: 1)",
    )
    ap.add_argument(
        "--force", action="store_true",
        help="regenerate thumbnails that already exist (clobbers manual edits)",
    )
    ap.add_argument(
        "--only",
        help="only this PDF stem, e.g. 2024-playing-with-fire",
    )
    args = ap.parse_args()

    papers_dir = args.papers_dir
    thumbs_dir = os.path.join(papers_dir, "thumbs")
    if not os.path.isdir(papers_dir):
        sys.exit(f"No papers folder at {papers_dir} — create it and drop <slug>.pdf files in.")
    og_dir = os.path.join(papers_dir, "og")
    os.makedirs(thumbs_dir, exist_ok=True)
    os.makedirs(og_dir, exist_ok=True)

    pdfs = sorted(f for f in os.listdir(papers_dir) if f.lower().endswith(".pdf"))
    if args.only:
        pdfs = [f for f in pdfs if os.path.splitext(f)[0] == args.only]
    if not pdfs:
        print("No PDFs found — nothing to do.")
        return

    made = skipped = failed = 0
    for pdf in pdfs:
        stem = os.path.splitext(pdf)[0]
        og_out = os.path.join(og_dir, f"{stem}.jpg")
        if not os.path.exists(og_out) or args.force:
            try:
                render_og(os.path.join(papers_dir, pdf), og_out, OG_PAGE.get(stem, 1))
                print(f"  ok    og/{stem}.jpg")
            except Exception as e:  # noqa: BLE001
                print(f"  FAIL  og/{stem}.jpg: {e}")
                failed += 1
        out = os.path.join(thumbs_dir, f"{stem}.jpg")
        if os.path.exists(out) and not args.force:
            print(f"  skip  {stem}.jpg (exists — --force to redo, or replace it by hand)")
            skipped += 1
            continue
        try:
            render_page(os.path.join(papers_dir, pdf), out, args.width, args.page)
            print(f"  ok    {stem}.jpg")
            made += 1
        except Exception as e:  # noqa: BLE001 - report and continue with the rest
            print(f"  FAIL  {pdf}: {e}")
            failed += 1

    rel = os.path.relpath(thumbs_dir, ROOT)
    print(f"\nDone — {made} generated, {skipped} skipped, {failed} failed. Thumbs in {rel}/")
    if failed:
        sys.exit(1)


if __name__ == "__main__":
    main()
