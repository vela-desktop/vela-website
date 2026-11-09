// Site-wide facts and links. Everything here is user-visible: keep it accurate
// and in sync with the Vela repository's README.

export const SITE = {
  name: 'Vela',
  url: 'https://velade.org',
  title: 'Vela — A modern, fluid and sharp Linux desktop',
  /** Ends every other page's <title>: "Install Vela" can't say what Vela is. */
  titleSuffix: 'Vela, Linux desktop',
  // Search results cut descriptions at about 155 characters.
  description:
    'Vela is an independent Linux desktop environment with its own Wayland compositor and Vulkan renderer, a Qt Quick shell, and its own Files and Settings.',
  tagline: 'A modern, fluid and sharp Linux desktop built for today’s hardware.',
  status: 'Beta',
  license: 'GPL-3.0-or-later',
} as const;

/**
 * Umami analytics (self-hosted). The scripts are only added to production
 * builds, only while `websiteId` is set, and never for visitors with Do Not
 * Track or Global Privacy Control on (src/components/Head.astro); `domains`
 * keeps local previews out of the stats. The recorder (session replay) takes its sampling and masking
 * settings from the Umami instance, and needs the tracker loaded first.
 */
export const UMAMI = {
  src: 'https://analytics.brandodev.it/script.js',
  recorderSrc: 'https://analytics.brandodev.it/recorder.js',
  websiteId: '4f12561f-5384-437e-a6cc-451a9aed37f0',
  domains: 'velade.org',
} as const;

/** The person who builds Vela and writes the journal, credited on every entry. */
export const AUTHOR = {
  name: 'Brando Giuffrida',
  url: 'https://github.com/BrandoDev',
} as const;

const REPO = 'https://github.com/vela-desktop/vela';

/**
 * What Vela runs on, for every page that says it: the homepage, Install and
 * the FAQ. Keep it in sync with the Vela README and docs/hardware.md.
 */
const NVIDIA_DRIVER = 'the proprietary driver 570 or newer';
export const SUPPORT = {
  vulkan: 'Vulkan 1.4',
  /** The drivers that provide it, as a phrase: "AMD or Intel with …, or NVK". */
  drivers: `AMD or Intel with Mesa 25.0 or newer, NVIDIA with ${NVIDIA_DRIVER}, or NVK`,
  nvidiaDriver: NVIDIA_DRIVER,
  /** Building from source works on any distribution that ships it. */
  wlroots: 'wlroots 0.20',
  /** Distributions with signed Beta packages and vela-update. */
  arch: ['Arch Linux', 'CachyOS', 'EndeavourOS'],
  fedora: 'Fedora 44',
  ubuntu: 'Ubuntu 26.10',
} as const;

export const DISTROS = [...SUPPORT.arch, SUPPORT.fedora, SUPPORT.ubuntu];

/**
 * The Cosign release Install tells Fedora and Ubuntu users to install, with
 * the SHA-256 of each package from its cosign_checksums.txt. vela-update
 * trusts Cosign to verify everything else, so the version is pinned and
 * checked, not "latest". Update all three together.
 */
export const COSIGN = {
  version: '3.1.4',
  rpm: { file: 'cosign-3.1.4-1.x86_64.rpm', sha256: '02fd4fe524932ccba09f7762fce76be35e5570d2023a1093cce776eefc6b62df' },
  deb: { file: 'cosign_3.1.4_amd64.deb', sha256: '6db74c0ad58e69fca184bf0c6c4be40304aa12ab81b4b672042f91979934d547' },
} as const;

/** "A, B and C". */
export function listOf(items: readonly string[], conjunction = 'and'): string {
  return items.length < 2 ? items.join('') : `${items.slice(0, -1).join(', ')} ${conjunction} ${items.at(-1)}`;
}

export const LINKS = {
  repo: REPO,
  readme: `${REPO}#readme`,
  install: '/install/',
  build: `${REPO}#build-from-source`,
  roadmap: `${REPO}/blob/main/docs/roadmap.md`,
  contributing: `${REPO}#contributing`,
  issues: `${REPO}/issues`,
  /** The Vela Desktop space on Matrix, as in the Vela README's Community section. */
  matrix: 'https://matrix.to/#/#vela:velade.org',
  commits: `${REPO}/commits/main`,
  docs: `${REPO}/tree/main/docs`,
  rendererDoc: `${REPO}/blob/main/docs/renderer.md`,
  license: `${REPO}/blob/main/LICENSE`,
  hardware: `${REPO}/blob/main/docs/hardware.md`,
  website: 'https://github.com/vela-desktop/vela-website',
  rss: '/rss.xml',
  faq: '/faq/',
  changes: '/changes/',
  privacy: '/privacy/',
} as const;

export const NAV = [
  { label: 'Desktop', href: '/#desktop' },
  { label: 'Philosophy', href: '/#philosophy' },
  { label: 'Install', href: '/install/' },
  { label: 'Journal', href: '/blog/' },
] as const;

/**
 * What comes next, from the roadmap's release sections (docs/roadmap.md in the
 * Vela repository), in release order. Shown on the homepage while the journal
 * has no entries. Update it when the roadmap changes.
 */
export const ROADMAP_NEXT = [
  'Touch, pen and tablet mode',
  'An on-screen keyboard and input methods',
  'Screen recording and text recognition in the snipping tool',
  'Start search across files and settings, and an emoji picker',
  'Vela’s own portal',
  'HDR and color management',
  'More languages',
] as const;
