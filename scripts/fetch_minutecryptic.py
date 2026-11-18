#!/usr/bin/env python3
"""
Fetch my Minute Cryptic daily-clue solves.
------------------------------------------
Minute Cryptic runs on Supabase. The site's own API reads the Supabase session
from a cookie, so each run:

  1. trades the stored refresh token for a fresh session
     (Supabase rotates refresh tokens: the old one is dead after this call),
  2. writes the NEW refresh token to --token-out straight away, so the workflow
     can save it back into the MC_REFRESH_TOKEN secret even if a later step fails,
  3. builds the same `sb-<ref>-auth-token` cookie the browser sends and calls
     /api/daily_solves (one month at a time) and /api/stats.

Only solve dates are available (no time or hints per clue), plus the account
totals from /api/stats.

Outputs:
  --output        CSV `date,solved` — one row per solved day, merged with what's
                  already there so history is never lost.
  --stats-output  JSON snapshot of /api/stats (streak, totals, par scores).

Env:
  MC_REFRESH_TOKEN  Supabase refresh token for a session used ONLY by this
                    script. Running it locally rotates the token, so CI's copy
                    goes stale; re-seed the secret afterwards (see README).

Standard library only.
"""

import argparse
import base64
import csv
import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request
from datetime import date, datetime
from zoneinfo import ZoneInfo

SITE = "https://www.minutecryptic.com"
SUPABASE_REF = "pubnjtzifbxpdxwnmvhm"
SUPABASE_URL = f"https://{SUPABASE_REF}.supabase.co"
# Public "anon" key, shipped in the site's own JavaScript bundle. It only
# identifies the project; the refresh token is what proves who I am.
SUPABASE_ANON_KEY = (
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9."
    "eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB1Ym5qdHppZmJ4cGR4d25tdmhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjI5MTE1OTksImV4cCI6MjAzODQ4NzU5OX0."
    "fJVLSZ_N_pNa4iycqzDsdnf2UVQ2DS7-Owl2DDOO4cg"
)
COOKIE_NAME = f"sb-{SUPABASE_REF}-auth-token"
COOKIE_CHUNK = 3180          # @supabase/ssr splits the cookie into chunks this size
TZ = "Europe/Zurich"
FIRST_MONTH = "2025-06"      # first solves on the account (2025-06-28)
UA = "Mozilla/5.0 (compatible; puzzle-tracker/1.0)"


def mask(value: str) -> None:
    """Hide a secret from GitHub Actions logs."""
    if os.environ.get("GITHUB_ACTIONS") == "true" and value:
        print(f"::add-mask::{value}")


def http_json(url: str, *, method="GET", headers=None, body=None):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, method=method,
                                 headers={"User-Agent": UA, **(headers or {})})
    if data is not None:
        req.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return json.load(resp)
    except urllib.error.HTTPError as e:
        detail = e.read().decode(errors="replace")[:300]
        sys.exit(f"{method} {url.split('?')[0]} -> HTTP {e.code}: {detail}")


def refresh_session(refresh_token: str) -> dict:
    return http_json(
        f"{SUPABASE_URL}/auth/v1/token?grant_type=refresh_token",
        method="POST",
        headers={"apikey": SUPABASE_ANON_KEY},
        body={"refresh_token": refresh_token},
    )


def session_cookie(session: dict) -> str:
    """The cookie header @supabase/ssr expects: base64url(JSON), chunked."""
    raw = json.dumps(session, separators=(",", ":")).encode()
    value = "base64-" + base64.urlsafe_b64encode(raw).decode().rstrip("=")
    if len(value) <= COOKIE_CHUNK:
        return f"{COOKIE_NAME}={value}"
    chunks = [value[i:i + COOKIE_CHUNK] for i in range(0, len(value), COOKIE_CHUNK)]
    return "; ".join(f"{COOKIE_NAME}.{i}={c}" for i, c in enumerate(chunks))


def months(start: str, end: str):
    y, m = map(int, start.split("-"))
    ey, em = map(int, end.split("-"))
    while (y, m) <= (ey, em):
        yield f"{y:04d}-{m:02d}"
        y, m = (y + 1, 1) if m == 12 else (y, m + 1)


def read_existing(path: str) -> set[str]:
    try:
        with open(path, newline="") as f:
            return {r["date"] for r in csv.DictReader(f) if r.get("solved") == "True"}
    except FileNotFoundError:
        return set()


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[1])
    ap.add_argument("--output", default="data/minutecryptic.csv")
    ap.add_argument("--stats-output", default="data/minutecryptic_stats.json")
    ap.add_argument("--token-out", required=True,
                    help="file to write the rotated refresh token to (keep it out of data/)")
    ap.add_argument("--start", help="first month to fetch, YYYY-MM "
                    "(default: the month before the latest saved solve, or the account's first month)")
    args = ap.parse_args()

    token = os.environ.get("MC_REFRESH_TOKEN", "").strip()
    if not token:
        sys.exit("MC_REFRESH_TOKEN is not set.")
    mask(token)

    session = refresh_session(token)
    new_token = session.get("refresh_token")
    if not new_token or not session.get("access_token"):
        sys.exit("Supabase refresh returned no session.")
    mask(new_token)
    mask(session["access_token"])
    # Save the rotated token before anything else can fail.
    fd = os.open(args.token_out, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
    with os.fdopen(fd, "w") as f:
        f.write(new_token)

    cookie = session_cookie(session)
    headers = {"Cookie": cookie, "Accept": "application/json"}
    today = datetime.now(ZoneInfo(TZ)).date()

    solved = read_existing(args.output)
    if args.start:
        start = args.start
    elif solved:
        latest = date.fromisoformat(max(solved))
        start = (f"{latest.year - 1}-12" if latest.month == 1
                 else f"{latest.year}-{latest.month - 1:02d}")
    else:
        start = FIRST_MONTH

    before = len(solved)
    tz = urllib.parse.quote(TZ, safe="")
    for month in months(start, today.strftime("%Y-%m")):
        resp = http_json(f"{SITE}/api/daily_solves?month={month}&tz={tz}", headers=headers)
        dates = resp.get("data")
        if not isinstance(dates, list):
            sys.exit(f"Unexpected /api/daily_solves response for {month}: {str(resp)[:200]}")
        solved.update(dates)

    os.makedirs(os.path.dirname(args.output) or ".", exist_ok=True)
    with open(args.output, "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["date", "solved"])
        for d in sorted(solved):
            w.writerow([d, "True"])

    stats = http_json(f"{SITE}/api/stats?today={today.isoformat()}", headers=headers)
    if "stats" not in stats:
        sys.exit(f"Unexpected /api/stats response: {str(stats)[:200]}")
    with open(args.stats_output, "w") as f:
        json.dump({"snapshot_date": today.isoformat(), **stats["stats"]}, f, indent=2)
        f.write("\n")

    print(f"Minute Cryptic: {len(solved)} solved days ({len(solved) - before} new, "
          f"months {start}..{today:%Y-%m}); streak {stats['stats'].get('streak')}, "
          f"total {stats['stats'].get('totalSolved')}.")


if __name__ == "__main__":
    main()
