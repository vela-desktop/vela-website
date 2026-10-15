# velade.org

The website of [Vela](https://github.com/vela-desktop/vela), a modern Linux desktop
environment: a product presentation and a development journal, built with
[Astro](https://astro.build/) as a fully static site and served by Apache.

## Develop

Requires Node.js 22.12 or newer.

```sh
npm install
npm run dev          # http://localhost:4321, drafts included
npm run build        # type-check and build to dist/ (drafts excluded)
npm run preview      # serve dist/ locally
```

The *What's new* page and the latest alpha build on *Install* are read from the
GitHub API at build time (`src/lib/vela.ts`). Without network access the build
still succeeds and those parts point to GitHub instead; set `GITHUB_TOKEN` to
raise the API rate limit.

## Writing for the journal

Entries live in `src/content/blog/`. Either a single file, or a folder with the
entry and its images together:

```
src/content/blog/frame-clock.md              → /blog/frame-clock/
src/content/blog/frame-clock/index.md        → /blog/frame-clock/  (images alongside)
```

Front matter:

```yaml
---
title: "How the frame clock learns latency"     # required
seoTitle: "How Vela's frame clock learns latency"  # optional; the whole <title> in search results
description: "One or two sentences for lists, feeds and previews."   # required; under ~155 characters
pubDate: 2026-10-20T18:30:00+02:00               # required; the time orders entries published the same day
updatedDate: 2026-10-24                          # optional
draft: true                                      # optional; drafts never reach production
cover: ./cover.webp                              # optional, relative to the entry
coverAlt: "What the cover shows"                 # required when cover is set
tags: ["Renderer", "Wayland"]                    # optional
---
```

- Search results show the page title as `<title> — Vela, Linux desktop`. When
  that still doesn't say what the entry is about ("On customization"), set
  `seoTitle` to a complete title instead, with the words people search for.
  Social previews keep `title`.
- Drafts are visible in `npm run dev` with a *Draft* badge. Production builds
  leave them out of pages, the journal index, the RSS feed and the sitemap.
- Entries without a cover get a generated one cut from Vela's wallpaper, and a
  matching social preview image with the title (`src/lib/og.ts`).
- Use `.mdx` when an entry needs components. `src/components/mdx/` provides
  `Figure` (optimized image with caption; `width="content" | "wide" | "full"`) and
  `Aside` (a set-apart note).
- Math is TeX: `$…$` inline, `$$` on the lines before and after a display
  formula. It becomes MathML at build time (KaTeX, `src/lib/markdown-plugins.mjs`),
  so pages load no math script or fonts. Keep plain numbers as text (`4×`, `125%`):
  as math they get operator spacing and lose the weight of bold text around them.
  A literal dollar sign is `\$`.
- `src/content/blog/formatting-reference.mdx` is a draft showing every supported
  element. It stays a draft; use it as a template.

The build fails on invalid front matter, so mistakes are caught before publishing.

### Translations

An entry can also be published in another language. The translation goes in
`src/content/translations/<lang>/`, named like the original:

```
src/content/blog/frame-clock.mdx                  → /blog/frame-clock/
src/content/translations/it/frame-clock.mdx       → /it/blog/frame-clock/
```

Its front matter is `title`, `description` and `pubDate`, plus optionally
`seoTitle`, `updatedDate`, `draft` and `coverAlt`; tags and cover come from the
original. The two pages link to each other ("Leggi in italiano" / "Read in
English") and declare each other with `hreflang`, in the sitemap too. A
translation has its own social preview image, and stays out of the journal
index, the topic pages and the RSS feed, which are in English. When the
original changes, update the translation and set its `updatedDate`.

Languages are listed in `src/lib/i18n.ts`, with the words around an entry
(byline, dates, pager) in each; a new one also needs adding to the sitemap's
`i18n` option in `astro.config.mjs`. A translation in a language not listed
there, or of an entry that doesn't exist, fails the build.

## Project layout

```
astro.config.mjs        site URL, fonts, Markdown pipeline, integrations
src/consts.ts           site metadata, links, roadmap list
src/lib/i18n.ts         journal languages and the words around an entry in each
src/styles/             tokens.css (design tokens), global.css, prose.css
src/components/home/    the five homepage chapters
src/components/journal/ journal layouts: feature, card, row, cover, empty state
src/layouts/            Base (every page), Page (Markdown pages), Article (journal entries)
src/pages/              routes: /, /blog/, /blog/<entry>/, /<lang>/blog/<entry>/,
                        /blog/topics/<tag>/, /changes/, /install/, /faq/, /privacy/,
                        /rss.xml, /robots.txt, 404
src/assets/             screenshots, brand artwork, fonts
.github/workflows/      CI: type-check, build, link check, Lighthouse (lighthouserc.json)
deploy/apache/          production Apache virtual host
deploy/nginx/           equivalent Nginx configuration (alternative)
scripts/deploy.sh       build and publish a release
docs/                   design.md, deployment.md
```

To change typefaces, see *Typography is meant to change* in
[docs/design.md](docs/design.md).

## Deploy

The site is plain static files behind Nginx Proxy Manager Plus and Apache on a
Debian VM — no Node.js at runtime. Everything is described in
[docs/deployment.md](docs/deployment.md); once the VM is prepared:

```sh
DEPLOY_HOST=deploy@<vm-address> scripts/deploy.sh
```

## Assets and licenses

- Screenshots, the Vela logo and the wallpaper come from the
  [Vela repository](https://github.com/vela-desktop/vela) and are licensed under
  GPL-3.0-or-later. Website-specific crops and the corrected wallpaper copy are
  described in [docs/design.md](docs/design.md#assets).
- Fonts are licensed under the SIL Open Font License 1.1; the license texts are in
  `src/assets/fonts/`: Instrument Sans, Newsreader, JetBrains Mono.
