#!/bin/sh
# Write the site's commit count to src/data/commits.json, which the colophon
# reads. Runs from .githooks/pre-commit, so the count includes the commit being
# made (hence the +1). Automated puzzle-data commits are left out. The count is
# worked out from the full history each time, so commits that skip the hook
# (CI, rebases) are picked up again by the next one made here.
n=$(git log --format=%s HEAD 2>/dev/null | grep -vc '^Update puzzle data')
printf '{ "count": %d }\n' $((n + 1)) > src/data/commits.json
git add src/data/commits.json
