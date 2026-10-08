# Vela website

Minimal [Astro](https://astro.build/) website for [velade.org](https://velade.org): landing page and Markdown development blog.

## Development

```sh
npm install
npm run dev
```

Build: `npm run build` (output in `dist/`).

## Blog

Posts live in `src/content/blog/*.md`. Add frontmatter (`title`, `description`, `pubDate`) and set `draft: false` to publish. The included example is intentionally a draft.

## Deploy

Static Astro project. On Cloudflare Pages use `npm run build` and output directory `dist`. Set the custom domain `velade.org` in your hosting provider. The GitHub link in `src/layouts/Base.astro` is a placeholder; replace it with the Vela repository URL.
