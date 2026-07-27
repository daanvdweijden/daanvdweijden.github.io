#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# Put the puzzle data in ./data for a local build.
#
# The data lives on the `puzzle-data` orphan branch (files at its root) rather
# than in main, so main's history isn't 6 "Update puzzle data" commits a day.
# main gitignores data/, which means a fresh clone has no data and
# src/lib/puzzles.ts can't build the /puzzles page until you run this.
#
# CI does the equivalent with `actions/checkout` — see the second checkout step
# in .github/workflows/deploy.yml.
#
# Sets data/ up as a git worktree, so `npm run data:pull` again just
# fast-forwards it to whatever the fetcher workflow has pushed since.
# ---------------------------------------------------------------------------
set -euo pipefail
cd "$(dirname "$0")/.."

# Skip the fetch before the branch has been pushed for the first time; the
# local branch is enough to create the worktree from.
if git ls-remote --exit-code --heads origin puzzle-data >/dev/null 2>&1; then
  git fetch origin puzzle-data
fi

# An empty data/ is just leftover scaffolding (git removes the tracked files on
# a branch switch but leaves the directory behind) — clear it and carry on.
if [ -d data ] && [ -z "$(ls -A data)" ]; then
  rmdir data
fi

if [ -e data/.git ]; then
  git -C data checkout puzzle-data
  git -C data pull --ff-only origin puzzle-data
  echo "Updated data/ from puzzle-data."
elif [ -e data ]; then
  cat >&2 <<'EOF'
data/ already exists but isn't a checkout of the puzzle-data branch.

If it's the leftover copy from before the data moved off main, its contents are
already on the branch and it's safe to replace:

    rm -rf data && npm run data:pull
EOF
  exit 1
else
  git worktree add data puzzle-data
  echo "Checked puzzle-data out into data/."
fi
