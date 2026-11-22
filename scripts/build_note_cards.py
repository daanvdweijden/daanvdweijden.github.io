#!/usr/bin/env python3
"""
Link-preview cards for notes.
-----------------------------
One square tile per note, like a book cover: the title and, a bit smaller,
the dek, in the two colours of the personal pages (sky-blue title,
peach dek, on burnt-orange paper), set top-left in Archivo. Written to
public/notes/og/<id>.png at 1200×1200. Note pages pick the tile up
automatically as their og:image (src/pages/notes/[id].astro).

    python3 -I scripts/build_note_cards.py            # every note
    python3 -I scripts/build_note_cards.py music-diversity

Rerun after changing a note's title or dek. `render_card()` is also used by
the blog workshop to put the same card on a gif (blog/_tools/card_gif.py).

Requires Pillow.
"""

import argparse
import re
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
NOTES = ROOT / "src" / "content" / "notes"
OUT = ROOT / "public" / "notes" / "og"
# Same file the site loads (allo-font, "friendly" cut); axes: optical size, weight.
FONT = ROOT / "node_modules" / "allo-font" / "fonts" / "webfonts" / "AlloVariableFriendly.woff2"

# Personal-side palette from src/layouts/Layout.astro (the swapped theme).
BG = "#7d300e"     # --bg
INK = "#c0d5ee"    # --ink, the title
MUTED = "#e6c2ad"  # --muted, the dek

DEK_SCALE = 0.7  # dek size relative to the title
DEK_MAX_LINES = 2  # longer deks get a warning: shorten them in the note


def font(size: int, weight: int = 410) -> ImageFont.FreeTypeFont:
    """Allo at the site's display weight; optical size follows the size, like the browser's auto opsz."""
    f = ImageFont.truetype(str(FONT), size)
    f.set_variation_by_axes([max(9, min(32, size)), weight])
    return f


def width(text: str, f: ImageFont.FreeTypeFont, track: float) -> float:
    return f.getlength(text) + track * f.size * max(len(text) - 1, 0)


def draw_tracked(d: ImageDraw.ImageDraw, xy, text, f, fill, track: float) -> None:
    """Text with letter-spacing (track in em, like CSS), keeping kerning."""
    x, y = xy
    for i, ch in enumerate(text):
        d.text((x, y), ch, font=f, fill=fill)
        nxt = text[i + 1] if i + 1 < len(text) else ""
        adv = f.getlength(ch + nxt) - f.getlength(nxt) if nxt else f.getlength(ch)
        x += adv + track * f.size


def wrap(text: str, f, max_w: float, track: float) -> list[str]:
    lines, line = [], ""
    for word in text.split():
        trial = f"{line} {word}".strip()
        if line and width(trial, f, track) > max_w:
            lines.append(line)
            line = word
        else:
            line = trial
    if line:
        lines.append(line)
    return lines


def render_card(title: str, dek: str | None, w: int = 1200, h: int = 1200) -> Image.Image:
    """Title then a smaller dek (DEK_SCALE), two colours, top-left.

    Not a slide: no big gap, the dek follows right under the title in the
    second colour. The title is as big as fits in about 80% of the
    width; wide strips (a band under a gif) shrink it to fit the height.
    """
    img = Image.new("RGB", (w, h), BG)
    d = ImageDraw.Draw(img)
    pad_x = round(max(min(w, h) * 0.07, w * 0.05))
    pad_y = round(min(pad_x, h * 0.15))
    max_w = (w - 2 * pad_x) * 0.9
    track = -0.02

    size = round(min(h * 0.3, w * 0.085))
    while True:
        tf, df = font(size), font(round(size * DEK_SCALE))
        t_lines = wrap(title, tf, max_w, track)
        d_lines = wrap(dek or "", df, max_w, track)
        t_lead, d_lead = round(size * 1.1), round(df.size * 1.3)
        gap = round(size * 0.3) if d_lines else 0
        block = len(t_lines) * t_lead + gap + len(d_lines) * d_lead
        if block <= h - 2 * pad_y or size < 12:
            break
        size = round(size * 0.94)

    y = pad_y - round(size * 0.12)  # optical: line box starts above the cap height
    for line in t_lines:
        draw_tracked(d, (pad_x, y), line, tf, INK, track)
        y += t_lead
    y += gap
    for line in d_lines:
        draw_tracked(d, (pad_x, y), line, df, MUTED, track)
        y += d_lead
    render_card.dek_lines = len(d_lines)
    return img


def front_matter(path: Path) -> dict:
    m = re.match(r"---\n(.*?)\n---", path.read_text(encoding="utf-8"), re.S)
    data = {}
    for line in (m.group(1) if m else "").splitlines():
        k, _, v = line.partition(":")
        v = v.strip()
        if len(v) >= 2 and v[0] == v[-1] and v[0] in "\"'":
            v = v[1:-1]
        data[k.strip()] = v
    return data


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("ids", nargs="*", help="note ids (folder names); default: all")
    args = ap.parse_args()
    OUT.mkdir(parents=True, exist_ok=True)
    for mdx in sorted(NOTES.glob("*/index.mdx")):
        nid = mdx.parent.name
        if args.ids and nid not in args.ids:
            continue
        fm = front_matter(mdx)
        if fm.get("draft") == "true":  # drafts stay private: no card in public/
            (OUT / f"{nid}.png").unlink(missing_ok=True)
            continue
        render_card(fm.get("title", nid), fm.get("dek")).save(OUT / f"{nid}.png", optimize=True)
        msg = f"notes/og/{nid}.png"
        if render_card.dek_lines > DEK_MAX_LINES:
            msg += f"  (dek runs to {render_card.dek_lines} lines; shorter reads better)"
        print(msg)


if __name__ == "__main__":
    main()
