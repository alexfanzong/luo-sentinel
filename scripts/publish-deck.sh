#!/usr/bin/env bash
# Publish the deck to the gh-pages branch.
#
# GitHub Pages for this repo is served from the gh-pages branch (no Actions),
# so editing app/public/deck.html does not update the live site on its own.
# This script mirrors the two source decks and their static assets onto
# gh-pages, rewriting absolute asset paths and the language-toggle links to be
# site-relative for the project-pages base path (/luo-sentinel/).
#
# Usage: scripts/publish-deck.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$ROOT/app/public"
WORKTREE="$(mktemp -d)"

cleanup() { git -C "$ROOT" worktree remove "$WORKTREE" --force >/dev/null 2>&1 || true; }
trap cleanup EXIT

git -C "$ROOT" fetch -q origin gh-pages
git -C "$ROOT" worktree add -q "$WORKTREE" origin/gh-pages
git -C "$WORKTREE" checkout -q -B gh-pages origin/gh-pages

cp "$SRC/atlas-map.png" "$SRC/luo-mark.png" "$WORKTREE/"

# Chinese deck -> index.html (live root) + deck.html
sed -e 's#src="/#src="#g' -e 's#url("/#url("#g' \
    -e 's#href="/deck.en.html"#href="deck.en.html"#g' \
    "$SRC/deck.html" > "$WORKTREE/index.html"
cp "$WORKTREE/index.html" "$WORKTREE/deck.html"

# English deck -> deck.en.html (its 中文 toggle points back to index.html)
sed -e 's#src="/#src="#g' -e 's#url("/#url("#g' \
    -e 's#href="/">中文#href="index.html">中文#g' \
    "$SRC/deck.en.html" > "$WORKTREE/deck.en.html"

git -C "$WORKTREE" add index.html deck.html deck.en.html atlas-map.png luo-mark.png
if git -C "$WORKTREE" diff --cached --quiet; then
  echo "No deck changes to publish."
  exit 0
fi

git -C "$WORKTREE" commit -q -m "Publish deck update"
git -C "$WORKTREE" push origin gh-pages
echo "Published deck to gh-pages. Live in ~1-3 min: https://alexfanzong.github.io/luo-sentinel/"
