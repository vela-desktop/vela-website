#!/bin/sh
# Build velade.org and publish it to the web server as a new release.
#
#   DEPLOY_HOST=deploy@<vm-address> scripts/deploy.sh
#   DEPLOY_HOST=local scripts/deploy.sh      (when building on the web server itself)
#
# Each run uploads dist/ to $DEPLOY_PATH/releases/<timestamp>/ (unchanged files
# are hard-linked to the previous release, so uploads stay small), then switches
# the "current" symlink in one atomic rename. The web server serves "current",
# so no reload is needed. The last $KEEP releases are kept for rollback (docs/deployment.md).
set -eu

: "${DEPLOY_HOST:?Set DEPLOY_HOST, e.g. DEPLOY_HOST=deploy@<vm-address>}"
DEPLOY_PATH="${DEPLOY_PATH:-/var/www/velade.org}"
KEEP="${KEEP:-5}"
SKIP_BUILD="${SKIP_BUILD:-0}"

cd "$(dirname "$0")/.."

if [ "$SKIP_BUILD" != "1" ]; then
  npm ci
  npm run build
fi

test -f dist/index.html || { echo "dist/ is missing or incomplete; run the build first." >&2; exit 1; }

release="$(date -u +%Y%m%dT%H%M%SZ)"
echo "Uploading release $release to $DEPLOY_HOST:$DEPLOY_PATH"

if [ "$DEPLOY_HOST" = "local" ]; then
  on_host() { sh -c "$1"; }
  target="$DEPLOY_PATH/releases/$release/"
else
  on_host() { ssh "$DEPLOY_HOST" "$1"; }
  target="$DEPLOY_HOST:$DEPLOY_PATH/releases/$release/"
fi

on_host "mkdir -p '$DEPLOY_PATH/releases'"
rsync -az --delete --chmod=D755,F644 --link-dest="$DEPLOY_PATH/current/" dist/ "$target"

on_host "set -e
  cd '$DEPLOY_PATH'
  ln -sfn 'releases/$release' current.next
  mv -T current.next current
  ls -1d releases/*/ | sort -r | tail -n +$((KEEP + 1)) | xargs -r rm -rf"

echo "Live: release $release"
