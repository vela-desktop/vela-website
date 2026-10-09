# velade.org

The website of [Vela](https://github.com/BrandoDev/vela), a modern Linux desktop
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
description: "One or two sentences for lists, feeds and previews."   # required
pubDate: 2026-10-20                              # required
updatedDate: 2026-10-24                          # optional
draft: true                                      # optional; drafts never reach production
cover: ./cover.webp                              # optional, relative to the entry
coverAlt: "What the cover shows"                 # required when cover is set
tags: ["Renderer", "Wayland"]                    # optional
---
```

- Drafts are visible in `npm run dev` with a *Draft* badge. Production builds
  leave them out of pages, the journal index, the RSS feed and the sitemap.
- Entries without a cover get a generated one cut from Vela's wallpaper.
- Use `.mdx` when an entry needs components. `src/components/mdx/` provides
  `Figure` (optimized image with caption; `width="content" | "wide" | "full"`) and
  `Aside` (a set-apart note).
- `src/content/blog/formatting-reference.mdx` is a draft showing every supported
  element. It stays a draft; use it as a template.

The build fails on invalid front matter, so mistakes are caught before publishing.

## Project layout

```
astro.config.mjs        site URL, fonts, Markdown pipeline, integrations
src/consts.ts           site metadata, links, roadmap list
src/styles/             tokens.css (design tokens), global.css, prose.css
src/components/home/    the five homepage chapters
src/components/journal/ journal layouts: feature, card, row, cover, empty state
src/pages/              routes: /, /blog/, /blog/<entry>/, /rss.xml, /robots.txt, 404
src/assets/             screenshots, brand artwork, fonts
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
  [Vela repository](https://github.com/BrandoDev/vela) and are licensed under
  GPL-3.0-or-later. Website-specific crops and the corrected wallpaper copy are
  described in [docs/design.md](docs/design.md#assets).
- Fonts are licensed under the SIL Open Font License 1.1; the license texts are in
  `src/assets/fonts/`: Instrument Sans, Newsreader, JetBrains Mono.
