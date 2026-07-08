#!/usr/bin/env python3
"""
Build a combined daily "activity wall" feed for the website.
----------------------------------------------------------------
Merges every game I played per day across both platforms into one file, all
read from the CSVs the fetchers already maintain (no live API calls here):

  * NRC  — Crux (data/crux_scores.csv) and every other hub game
           (data/nrc_games.csv: Vorto, Precies vier, Sudoku, Cijferblok,
           Koprol, Aan Zet, Scrypto, In het midden, Woordzoeker)
  * NYT  — Mini + Midi (data/*_scores.csv) and Wordle / Connections / Strands
           (data/nyt_games.csv)

Output: data/activity.json
  {
    "generated":   "YYYY-MM-DD",
    "mini_streak": <current NYT Mini streak>,
    "game_meta":   { slug: {label, source} },
    "days":        [ {date, played:[slug, ...]}, ... ]   # newest first
  }

The website maps each slug -> an icon.
"""

import csv
import json
import os
from datetime import datetime, timedelta

ROOT     = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(ROOT, "data")

# NRC slug -> friendly label, for the "other games" columns in nrc_games.csv
# (must match the RENDERER_SLUG values in nrc-puzzel-tracker's fetch_nrc_games.py).
NRC_GAME_LABELS = {
    "vorto":         "Vorto",
    "precies-vier":  "Precies vier",
    "sudoku":        "Sudoku",
    "cijferblok":    "Cijferblok",
    "koprol":        "Koprol",
    "aan-zet":       "Aan Zet",
    "scrypto":       "Scrypto",
    "in-het-midden": "In het midden",
    "woordzoeker":   "Woordzoeker",
}


def crux_activity(csv_path: str):
    """date -> set({"crux"}) for every solved row in crux_scores.csv."""
    by_date = {}
    try:
        with open(csv_path, newline="") as f:
            for row in csv.DictReader(f):
                if row.get("date") and row.get("solved") == "True":
                    by_date.setdefault(row["date"], set()).add("crux")
    except FileNotFoundError:
        pass
    return by_date


def nrc_games_activity(csv_path: str):
    """date -> set(slugs) for every True column in nrc_games.csv."""
    by_date = {}
    try:
        with open(csv_path, newline="") as f:
            for row in csv.DictReader(f):
                date = row.get("date")
                if not date:
                    continue
                for slug in NRC_GAME_LABELS:
                    if row.get(slug) == "True":
                        by_date.setdefault(date, set()).add(slug)
    except FileNotFoundError:
        pass
    return by_date


def nyt_dates(csv_path: str) -> set[str]:
    dates = set()
    try:
        with open(csv_path, newline="") as f:
            for row in csv.DictReader(f):
                if row.get("date"):
                    dates.add(row["date"])
    except FileNotFoundError:
        pass
    return dates


def current_streak(dates: set[str]) -> int:
    """Consecutive days ending at the most recent date present."""
    if not dates:
        return 0
    latest = max(datetime.strptime(d, "%Y-%m-%d") for d in dates)
    streak, cur = 0, latest
    while cur.strftime("%Y-%m-%d") in dates:
        streak += 1
        cur -= timedelta(days=1)
    return streak


def main():
    by_date, meta = {}, {}

    for date, slugs in crux_activity(os.path.join(DATA_DIR, "crux_scores.csv")).items():
        by_date.setdefault(date, set()).update(slugs)
    if any("crux" in slugs for slugs in by_date.values()):
        meta["crux"] = {"label": "Crux", "source": "nrc"}

    for date, slugs in nrc_games_activity(os.path.join(DATA_DIR, "nrc_games.csv")).items():
        by_date.setdefault(date, set()).update(slugs)
        for slug in slugs:
            meta[slug] = {"label": NRC_GAME_LABELS[slug], "source": "nrc"}

    mini = nyt_dates(os.path.join(DATA_DIR, "mini_scores.csv"))
    midi = nyt_dates(os.path.join(DATA_DIR, "midi_scores.csv"))
    for d in mini:
        by_date.setdefault(d, set()).add("mini")
    for d in midi:
        by_date.setdefault(d, set()).add("midi")
    meta["mini"] = {"label": "NYT Mini", "source": "nyt"}
    meta["midi"] = {"label": "NYT Midi", "source": "nyt"}

    # Wordle / Connections / Strands from fetch_nyt_games.py
    nyt_extra = {"wordle": "NYT Wordle", "connections": "NYT Connections",
                 "strands": "NYT Strands"}
    try:
        with open(os.path.join(DATA_DIR, "nyt_games.csv"), newline="") as f:
            for r in csv.DictReader(f):
                for g, label in nyt_extra.items():
                    if r.get(g) == "True":
                        by_date.setdefault(r["date"], set()).add(g)
                        meta[g] = {"label": label, "source": "nyt"}
    except FileNotFoundError:
        pass

    # order slugs within a day: NYT first (fixed order), then NRC alphabetically
    nyt_order = ["mini", "midi", "wordle", "connections", "strands"]
    order = ([s for s in nyt_order if s in meta]
             + sorted(s for s in meta if meta[s]["source"] == "nrc"))
    days = [
        {"date": d, "played": [s for s in order if s in by_date[d]]}
        for d in sorted(by_date, reverse=True)
    ]

    feed = {
        "generated":   datetime.today().strftime("%Y-%m-%d"),
        "mini_streak": current_streak(mini),
        "game_meta":   meta,
        "days":        days,
    }
    with open(os.path.join(DATA_DIR, "activity.json"), "w") as f:
        json.dump(feed, f, indent=2)

    print(f"Wrote data/activity.json — {len(days)} active days, "
          f"NYT Mini streak {feed['mini_streak']}.")
    print("Recent:")
    for day in days[:7]:
        labels = [meta[s]["label"] for s in day["played"]]
        print(f"  {day['date']}: {', '.join(labels)}")


if __name__ == "__main__":
    main()
