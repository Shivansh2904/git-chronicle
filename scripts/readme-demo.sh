#!/bin/sh
# Regenerates the demo in README.md: runs the built CLI against
# expressjs/express at a fixed commit, with UTC times and no colour.
#
#   npm run build && sh scripts/readme-demo.sh [path-to-an-express-clone]
#
# Without an argument it clones express into a temporary directory.
set -eu

SHA=98bd4cd96b250d25e1672c36f49cfc743bc801e7
CLI="$(cd "$(dirname "$0")/.." && pwd)/dist/index.js"
DIR=${1:-"$(mktemp -d)/express"}

[ -d "$DIR/.git" ] || git clone --quiet https://github.com/expressjs/express "$DIR"
git -C "$DIR" checkout --quiet "$SHA"
cd "$DIR"

for args in "heatmap" "files -n 5" "streaks"; do
  echo "\$ git-chronicle $args"
  # stdout only: the progress spinner writes to stderr.
  TZ=UTC NO_COLOR=1 node "$CLI" $args 2>/dev/null
  echo
done
