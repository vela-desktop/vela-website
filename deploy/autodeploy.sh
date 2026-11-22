#!/bin/sh
# Publish origin/main whenever it has a commit that is not live yet, and
# rebuild when the Vela repository's main branch or release tags change
# (the What's new page and the latest Beta come from them, src/lib/vela.ts),
# then announce new journal entries (scripts/announce.mjs).
# Runs from a dedicated clone on the web server, started by
# deploy/systemd/velade-autodeploy.timer (see docs/deployment.md).
set -eu

VELA=https://github.com/vela-desktop/vela.git

main() {
  cd "$(dirname "$0")/.."
  state="$HOME/deployed-commit"

  git fetch --quiet origin main
  target="$(git rev-parse FETCH_HEAD)"
  # The git protocol, not the API: no rate limit for a check every two minutes.
  # If GitHub can't be reached, the site keeps what it has.
  if refs="$(git ls-remote "$VELA" refs/heads/main 'refs/tags/v*')"; then
    vela="$(printf '%s\n' "$refs" | sha256sum | cut -c1-16)"
  else
    vela="$(cut -s -d' ' -f2 "$state" 2>/dev/null || true)"
  fi
  if [ "$(cat "$state" 2>/dev/null)" != "$target $vela" ]; then
    echo "Deploying $(git log -1 --format='%h %s' "$target") (Vela $vela)"
    git reset --quiet --hard "$target"
    DEPLOY_HOST=local scripts/deploy.sh
    # Recorded only on success, so a failed build is retried on the next run.
    echo "$target $vela" > "$state"
  fi

  # New journal entries, once live, to Discord and Matrix. On every run, not
  # only after a deploy, so a post that failed is tried again; a failure here
  # never fails the deploy.
  node scripts/announce.mjs || echo "Announcing new entries failed; it will be tried again." >&2
}

# Wrapped in a function so the shell has read the whole script before
# git reset replaces it.
main "$@"
