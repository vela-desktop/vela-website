// What is happening in the Vela repository, read from the GitHub API at build
// time: the latest Beta release and the recent changes on main. Pages built
// from it stay current because deploy/autodeploy.sh also rebuilds the site
// when Vela's main branch or its release tags change.
//
// The API is optional for the build: if it can't be reached, the functions
// return null or an empty list, and the pages point to GitHub instead.
// GITHUB_TOKEN, when set (as in CI), raises the rate limit.

import { LINKS, SUPPORT } from '../consts';

const API = 'https://api.github.com/repos/vela-desktop/vela';

export interface BetaRelease {
  /** Version from the tag, e.g. "0.1.0" for v0.1.0. */
  version: string;
  /** The tag itself, e.g. "v0.1.0". */
  tag: string;
  published: Date;
  /** The packages the release has, in bytes: Arch, Fedora, Ubuntu. */
  packages: { label: string; size: number }[];
  url: string;
}

export type ChangeKind = 'New' | 'Improved' | 'Fixed' | 'Faster' | 'Security';

export interface Change {
  kind: ChangeKind;
  /** The commit summary without its type prefix or pull request number. */
  text: string;
  date: Date;
  url: string;
}

const cache = new Map<string, Promise<unknown>>();

function get<T>(path: string): Promise<T | null> {
  if (!cache.has(path)) {
    const token = process.env.GITHUB_TOKEN;
    const request = fetch(`${API}${path}`, {
      headers: {
        Accept: 'application/vnd.github+json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      signal: AbortSignal.timeout(15_000),
    })
      .then((response) => {
        if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
        return response.json();
      })
      .catch((error) => {
        console.warn(`[vela] GitHub API ${path}: ${error.message}; building without it.`);
        return null;
      });
    cache.set(path, request);
  }
  return cache.get(path) as Promise<T | null>;
}

interface GitHubRelease {
  draft: boolean;
  published_at: string;
  html_url: string;
  tag_name: string;
  assets: { name: string; size: number }[];
}

// Release assets of the Beta channel (the `vela` package), by distribution.
const PACKAGES = [
  { label: 'Arch Linux package', name: /^vela-\d[^/]*-x86_64\.pkg\.tar\.zst$/ },
  { label: `${SUPPORT.fedora} RPM`, name: /^vela-\d[^/]*\.x86_64\.rpm$/ },
  { label: `${SUPPORT.ubuntu} DEB`, name: /^vela_\d[^/]*_amd64\.deb$/ },
];

/** The newest numbered Beta release, as installed by `vela-update --channel beta`. */
export async function latestBeta(): Promise<BetaRelease | null> {
  const releases = await get<GitHubRelease[]>('/releases?per_page=10');
  for (const release of releases ?? []) {
    const version = release.tag_name.match(/^v(0\.\d+\.\d+)$/)?.[1];
    if (release.draft || !version) continue;
    const packages = PACKAGES.flatMap(({ label, name }) => {
      const asset = release.assets.find((asset) => name.test(asset.name));
      return asset ? [{ label, size: asset.size }] : [];
    });
    if (packages.length === 0) continue;
    return {
      version,
      tag: release.tag_name,
      published: new Date(release.published_at),
      packages,
      url: release.html_url,
    };
  }
  return null;
}

interface GitHubCommit {
  sha: string;
  html_url: string;
  commit: { message: string; committer: { date: string } };
}

// Conventional commit types that people using Vela would notice. Everything
// else with a type (ci, docs, chore, refactor, test, build) is left out.
const KINDS: Record<string, ChangeKind> = {
  feat: 'New',
  fix: 'Fixed',
  perf: 'Faster',
  security: 'Security',
};

// Summaries without a type are kept, except for these.
const SKIP = /^(Bump|Merge|Refactor|Revert)\b/;

// Earlier commits are written in Italian; the site is in English.
const SINCE = new Date('2026-10-07T00:00:00Z');

/** User-facing changes on Vela's main branch, newest first. */
export async function recentChanges(): Promise<Change[]> {
  const commits = await get<GitHubCommit[]>('/commits?per_page=100');
  const changes: Change[] = [];
  for (const { commit, html_url } of commits ?? []) {
    const date = new Date(commit.committer.date);
    if (date < SINCE) continue;
    const summary = commit.message.split('\n')[0].trim();
    const typed = summary.match(/^(\w+)(?:\([^)]*\))?!?:\s*(.+)$/);
    let kind: ChangeKind | undefined;
    let text: string;
    if (typed) {
      kind = KINDS[typed[1].toLowerCase()];
      text = typed[2];
    } else {
      kind = SKIP.test(summary) ? undefined : 'Improved';
      text = summary;
    }
    if (!kind) continue;

    // "… (#22)" links to the pull request, which explains the change best.
    const pr = text.match(/\s*\(#(\d+)\)$/);
    if (pr) text = text.slice(0, pr.index);
    changes.push({
      kind,
      text: text.charAt(0).toUpperCase() + text.slice(1),
      date,
      url: pr ? `https://github.com/vela-desktop/vela/pull/${pr[1]}` : html_url,
    });
  }
  return changes;
}

/** How many people starred the Vela repository, or null without the API. */
export async function stars(): Promise<number | null> {
  const repo = await get<{ stargazers_count: number }>('');
  return repo?.stargazers_count ?? null;
}

/** A star count as short as GitHub shows it: 102, 1.2k, 12k. */
export function formatStars(count: number): string {
  if (count < 1000) return String(count);
  const thousands = count / 1000;
  return `${thousands < 10 ? Math.floor(thousands * 10) / 10 : Math.floor(thousands)}k`;
}

/**
 * `git clone` of Vela at its latest Beta release, so that the vela-update it
 * runs is the released one; of main when the build couldn't read the release.
 */
export async function cloneCommand(): Promise<string> {
  const release = await latestBeta();
  return release ? `git clone --branch ${release.tag} ${LINKS.repo}.git` : `git clone ${LINKS.repo}.git`;
}
