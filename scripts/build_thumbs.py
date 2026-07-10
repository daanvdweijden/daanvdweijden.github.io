#!/usr/bin/env python3
"""
Generate first-page thumbnails for publication PDFs.
----------------------------------------------------
Renders page 1 of every PDF in public/papers/ to a JPG in public/papers/thumbs/,
named after the PDF (2024-foo.pdf -> thumbs/2024-foo.jpg). The website picks the
thumbnail up automatically for any publication whose `file:` frontmatter points
at that PDF (see src/lib/pubs.ts -> thumbSrc).

Workflow:
  1. Drop <slug>.pdf into public/papers/  (slug usually matches the .md filename)
  2. Add `file: <slug>.pdf` to the publication's frontmatter
  3. Run this script:  python3 scripts/build_thumbs.py
  4. Commit the PDF and the generated thumbs/<slug>.jpg

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


def render_first_page(pdf_path: str, out_path: str, width: int) -> None:
    """Render page 1 of pdf_path to a `width`px-wide JPG at out_path."""
    doc = fitz.open(pdf_path)
    try:
        if doc.page_count == 0:
            raise ValueError("PDF has no pages")
        page = doc.load_page(0)
        # Render directly at the target width (crisp, antialiased) rather than
        # rendering large and downscaling.
        zoom = width / page.rect.width
        pix = page.get_pixmap(matrix=fitz.Matrix(zoom, zoom), alpha=False)
        pix.save(out_path)
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
        "--width", type=int, default=480,
        help="output thumbnail width in pixels (default: 480)",
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
    os.makedirs(thumbs_dir, exist_ok=True)

    pdfs = sorted(f for f in os.listdir(papers_dir) if f.lower().endswith(".pdf"))
    if args.only:
        pdfs = [f for f in pdfs if os.path.splitext(f)[0] == args.only]
    if not pdfs:
        print("No PDFs found — nothing to do.")
        return

    made = skipped = failed = 0
    for pdf in pdfs:
        stem = os.path.splitext(pdf)[0]
        out = os.path.join(thumbs_dir, f"{stem}.jpg")
        if os.path.exists(out) and not args.force:
            print(f"  skip  {stem}.jpg (exists — --force to redo, or replace it by hand)")
            skipped += 1
            continue
        try:
            render_first_page(os.path.join(papers_dir, pdf), out, args.width)
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
