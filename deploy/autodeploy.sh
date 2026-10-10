#!/bin/sh
# Publish origin/main whenever it has a commit that is not live yet.
# Runs from a dedicated clone on the web server, started by
# deploy/systemd/velade-autodeploy.timer (see docs/deployment.md).
set -eu

main() {
  cd "$(dirname "$0")/.."
  state="$HOME/deployed-commit"

  git fetch --quiet origin main
  target="$(git rev-parse FETCH_HEAD)"
  if [ "$(cat "$state" 2>/dev/null)" = "$target" ]; then
    exit 0
  fi

  echo "Deploying $(git log -1 --format='%h %s' "$target")"
  git reset --quiet --hard "$target"
  DEPLOY_HOST=local scripts/deploy.sh
  # Recorded only on success, so a failed build is retried on the next run.
  echo "$target" > "$state"
}

# Wrapped in a function so the shell has read the whole script before
# git reset replaces it.
main "$@"
