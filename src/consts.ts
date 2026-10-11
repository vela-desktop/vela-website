// Site-wide facts and links. Everything here is user-visible: keep it accurate
// and in sync with the Vela repository's README.

export const SITE = {
  name: 'Vela',
  url: 'https://velade.org',
  title: 'Vela — A modern, fluid and sharp Linux desktop',
  description:
    'Vela is an independent Linux desktop environment with its own Wayland compositor and Vulkan renderer, a Qt Quick shell, and a file manager and settings app built to match.',
  tagline: 'A modern, fluid and sharp Linux desktop built for today’s hardware.',
  status: 'Alpha',
  license: 'GPL-3.0-or-later',
  locale: 'en_US',
} as const;

/**
 * Umami analytics (self-hosted). The scripts are only added to production
 * builds, and only while `websiteId` is set; `domains` keeps local previews out
 * of the stats. The recorder (session replay) takes its sampling and masking
 * settings from the Umami instance, and needs the tracker loaded first.
 */
export const UMAMI = {
  src: 'https://analytics.brandodev.it/script.js',
  recorderSrc: 'https://analytics.brandodev.it/recorder.js',
  websiteId: '4f12561f-5384-437e-a6cc-451a9aed37f0',
  domains: 'velade.org',
} as const;

const REPO = 'https://github.com/vela-desktop/vela';

export const LINKS = {
  repo: REPO,
  readme: `${REPO}#readme`,
  install: `${REPO}#install`,
  build: `${REPO}#build-from-source`,
  roadmap: `${REPO}#roadmap`,
  contributing: `${REPO}#contributing`,
  issues: `${REPO}/issues`,
  commits: `${REPO}/commits/main`,
  docs: `${REPO}/tree/main/docs`,
  rendererDoc: `${REPO}/blob/main/docs/renderer.md`,
  license: `${REPO}/blob/main/LICENSE`,
  website: 'https://github.com/vela-desktop/vela-website',
  rss: '/rss.xml',
} as const;

export const NAV = [
  { label: 'Desktop', href: '/#desktop' },
  { label: 'Philosophy', href: '/#philosophy' },
  { label: 'Journal', href: '/blog/' },
] as const;

/**
 * The "Next" list from the README roadmap. Shown on the homepage while the
 * journal has no entries. Update it when the README changes.
 */
export const ROADMAP_NEXT = [
  'Input methods and an emoji panel',
  'An Updates page in Settings, with a notification when a new version is out',
  'Start menu: recommended files, and search across files and settings',
  'Screen recording in the snipping tool',
  'More languages',
  'Vela’s own login screen',
  'HDR and color management',
] as const;
