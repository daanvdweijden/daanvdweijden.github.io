#!/usr/bin/env python3
"""
Update the /books page from a Goodreads library export.

Goodreads switched off its RSS feeds (November 2026) and shelf pages now need a
login, so the site can no longer fetch books by itself. Instead:

  1. Goodreads → My Books → Import and export → Export Library, then download
     the file (goodreads_library_export.csv).
  2. npm run books                       # newest export in ~/Downloads
     npm run books -- path/to/export.csv # or a specific file

This rewrites data/books.json (the `puzzle-data` branch checkout, see
scripts/pull_data.sh), commits and pushes it, and starts a deploy. Pass
--no-push to only write the file.

Only the `read` shelf goes in, and only the fields the page shows: title,
author, rating, review, dates and a cover URL. Private notes, other shelves and
the rest of the export never leave your machine. The review markup is
sanitized at build time by src/lib/books.ts, not here.

Covers aren't in the export. A book already in books.json keeps its cover; a
new one gets the og:image from its (public) Goodreads book page.
"""
import argparse
import csv
import glob
import html
import json
import os
import re
import subprocess
import sys
import urllib.request
from datetime import datetime, timezone

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, "data")
BOOKS_JSON = os.path.join(DATA, "books.json")
UA = "Mozilla/5.0 (personal site book import)"


def newest_export() -> str:
    files = glob.glob(os.path.expanduser("~/Downloads/goodreads_library_export*.csv"))
    if not files:
        sys.exit("No goodreads_library_export*.csv in ~/Downloads. Pass the file's path.")
    return max(files, key=os.path.getmtime)


def iso_date(value: str) -> str | None:
    # Export dates look like 2026/11/18.
    value = (value or "").strip()
    if not value:
        return None
    for fmt in ("%Y/%m/%d", "%Y-%m-%d"):
        try:
            d = datetime.strptime(value, fmt).replace(tzinfo=timezone.utc)
            return d.strftime("%Y-%m-%dT00:00:00.000Z")
        except ValueError:
            pass
    return None


def rating(value: str) -> float | int:
    # "4.0", "4.5" or "0" (unrated). Goodreads has half stars; whole ones stay ints.
    n = float(value or 0)
    return int(n) if n.is_integer() else n


def review_html(raw: str) -> str:
    """Turn Goodreads' review syntax into the HTML the RSS feed used to carry."""
    text = raw or ""
    # Book and author tags became links in the feed. You type [book:Title|123];
    # the export stores [b:Title|123|Title|Author|cover url|work id].
    text = re.sub(
        r"\[(?:b|book):([^\]|]+)\|(\d+)[^\]]*\]",
        lambda m: f'<a href="https://www.goodreads.com/book/show/{m[2]}">{html.escape(m[1])}</a>',
        text,
    )
    text = re.sub(
        r"\[(?:a|author):([^\]|]+)\|(\d+)[^\]]*\]",
        lambda m: f'<a href="https://www.goodreads.com/author/show/{m[2]}">{html.escape(m[1])}</a>',
        text,
    )
    text = re.sub(r"\[/?spoiler\]", "", text)
    # Line breaks come through as <br/> already; any bare newlines get the same.
    text = text.replace("\r\n", "\n").replace("\n", "<br />")
    return text.strip()


def fetch_cover(book_id: str) -> str:
    try:
        req = urllib.request.Request(f"https://www.goodreads.com/book/show/{book_id}", headers={"User-Agent": UA})
        with urllib.request.urlopen(req, timeout=20) as res:
            page = res.read().decode("utf-8", "replace")
        m = re.search(r'property="og:image" content="([^"]+)"', page) or re.search(r'og:image" content="([^"]+)"', page)
        return html.unescape(m[1]) if m else ""
    except Exception as e:  # a missing cover is fine, the page shows the title instead
        print(f"  no cover for {book_id}: {e}", file=sys.stderr)
        return ""


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("export", nargs="?", help="Goodreads export CSV (default: newest in ~/Downloads)")
    ap.add_argument("--no-push", action="store_true", help="only write data/books.json")
    args = ap.parse_args()

    if not os.path.exists(os.path.join(DATA, ".git")):
        sys.exit("data/ isn't checked out. Run `npm run data:pull` first.")
    if not args.no_push:
        subprocess.run(["git", "-C", DATA, "pull", "-q", "--ff-only", "origin", "puzzle-data"], check=True)

    path = args.export or newest_export()
    print(f"Reading {path}")

    old = {}
    if os.path.exists(BOOKS_JSON):
        with open(BOOKS_JSON, encoding="utf-8") as f:
            old = {b["id"]: b for b in json.load(f).get("books", [])}

    with open(path, newline="", encoding="utf-8-sig") as f:
        rows = [r for r in csv.DictReader(f) if r.get("Exclusive Shelf") == "read"]
    if not rows:
        sys.exit("No books on the read shelf in that file. Is it a Goodreads library export?")

    books = []
    for r in rows:
        book_id = r["Book Id"].strip()
        image = old.get(book_id, {}).get("imageUrl") or fetch_cover(book_id)
        added = iso_date(r.get("Date Added", "")) or datetime.now(timezone.utc).strftime("%Y-%m-%dT00:00:00.000Z")
        books.append({
            "id": book_id,
            "title": r["Title"].strip(),
            "author": r["Author"].strip(),
            "imageUrl": image,
            "rating": rating(r.get("My Rating", "")),
            "reviewHtml": review_html(r.get("My Review", "")),
            "readAt": iso_date(r.get("Date Read", "")),
            "addedAt": added,
        })
    books.sort(key=lambda b: b["readAt"] or b["addedAt"], reverse=True)

    new = [b["title"] for b in books if b["id"] not in old]
    gone = [b["title"] for i, b in old.items() if i not in {x["id"] for x in books}]
    changed = [b["title"] for b in books if b["id"] in old
               and (old[b["id"]].get("rating") != b["rating"] or old[b["id"]].get("readAt") != b["readAt"])]

    with open(BOOKS_JSON, "w", encoding="utf-8") as f:
        json.dump({"fetchedAt": datetime.now(timezone.utc).isoformat(), "source": "goodreads-export", "books": books},
                  f, ensure_ascii=False, indent=2)
        f.write("\n")

    print(f"{len(books)} read books. New: {len(new)}, removed: {len(gone)}, rating/date changed: {len(changed)}.")
    for t in new:
        print(f"  + {t}")
    for t in gone:
        print(f"  - {t}")
    latest = next((b for b in books if b["reviewHtml"]), None)
    if latest:
        print(f"Latest review on the page: {latest['title']}")

    if args.no_push:
        return
    subprocess.run(["git", "-C", DATA, "add", "books.json"], check=True)
    if subprocess.run(["git", "-C", DATA, "diff", "--cached", "--quiet"]).returncode == 0:
        print("books.json unchanged, nothing to deploy.")
        return
    stamp = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M")
    subprocess.run(["git", "-C", DATA, "commit", "-q", "-m", f"Update books from Goodreads export ({stamp} UTC)"], check=True)
    subprocess.run(["git", "-C", DATA, "push", "-q", "origin", "HEAD:puzzle-data"], check=True)
    subprocess.run(["gh", "workflow", "run", "deploy.yml", "--ref", "main"], cwd=ROOT, check=True)
    print("Pushed. The deploy is running; the page updates in about a minute.")


if __name__ == "__main__":
    main()
