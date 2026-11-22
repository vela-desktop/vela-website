// @ts-check
import { defineConfig, fontProviders } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { satteri } from '@astrojs/markdown-satteri';
import { headingAnchors, math, tableWrap } from './src/lib/markdown-plugins.mjs';
import { UMAMI } from './src/consts.ts';
import { lastModified } from './src/lib/lastmod.mjs';
import { pagefind } from './src/lib/pagefind.mjs';

const analytics = new URL(UMAMI.src).origin;
const lastmod = lastModified();

export default defineConfig({
  site: 'https://velade.org',
  trailingSlash: 'always',
  // Stylesheets are always files, never inline <style>: Astro doesn't hash the
  // styles of components used only inside MDX entries, so the CSP below would
  // block them if they were inlined. Files are covered by 'self'.
  build: { format: 'directory', inlineStylesheets: 'never' },
  // Typefaces. Each family is registered once here and exposed as a CSS
  // variable; src/styles/tokens.css maps those variables to the design roles
  // (--font-display, --font-body, --font-serif, --font-mono). To change a
  // typeface, edit the entry below (or swap the provider, e.g.
  // fontProviders.fontsource() with a new `name`) — no component needs to change.
  // Astro hashes the files, emits @font-face rules, preloads what <Font> asks
  // for, and generates metric-matched fallbacks to avoid layout shift.
  fonts: [
    {
      provider: fontProviders.local(),
      name: 'Instrument Sans',
      cssVariable: '--font-family-sans',
      fallbacks: ['ui-sans-serif', 'system-ui', 'sans-serif'],
      options: {
        variants: [
          { src: ['./src/assets/fonts/instrument-sans-latin-standard-normal.woff2'], weight: '400 700', style: 'normal' },
          { src: ['./src/assets/fonts/instrument-sans-latin-standard-italic.woff2'], weight: '400 700', style: 'italic' },
        ],
      },
    },
    {
      provider: fontProviders.local(),
      name: 'Newsreader',
      cssVariable: '--font-family-serif',
      fallbacks: ['ui-serif', 'Georgia', 'serif'],
      options: {
        variants: [
          { src: ['./src/assets/fonts/newsreader-latin-wght-normal.woff2'], weight: '200 800', style: 'normal' },
          { src: ['./src/assets/fonts/newsreader-latin-wght-italic.woff2'], weight: '200 800', style: 'italic' },
        ],
      },
    },
    {
      provider: fontProviders.local(),
      name: 'JetBrains Mono',
      cssVariable: '--font-family-mono',
      fallbacks: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      options: {
        variants: [
          { src: ['./src/assets/fonts/jetbrains-mono-latin-wght-normal.woff2'], weight: '100 800', style: 'normal' },
        ],
      },
    },
  ],
  integrations: [
    mdx(),
    sitemap({
      filter: (page) => !page.endsWith('/404/'),
      // Pages under /it/ are the Italian versions of the same path without
      // it; the sitemap links each pair (src/lib/i18n.ts lists the languages).
      i18n: { defaultLocale: 'en', locales: { en: 'en', it: 'it' } },
      serialize(item) {
        const date = lastmod.get(new URL(item.url).pathname);
        return date ? { ...item, lastmod: date.toISOString() } : item;
      },
    }),
    pagefind(),
  ],
  markdown: {
    processor: satteri({ features: { math: true }, hastPlugins: [math, headingAnchors, tableWrap] }),
    shikiConfig: {
      // Colors come from CSS custom properties in src/styles/prose.css,
      // so code blocks follow the site's tokens.
      theme: 'css-variables',
      wrap: false,
    },
  },
  // Content Security Policy, emitted as a <meta> tag on every page. Astro hashes
  // the inline <script> and <style> elements it renders, so they keep working
  // without 'unsafe-inline'; style="" attributes are allowed, since components
  // pass CSS custom properties through them. The only other origin is Umami
  // (src/consts.ts): its tracker, the replay recorder's worker, and the endpoint
  // both send to. 'wasm-unsafe-eval' lets the journal's search (Pagefind) run
  // its WebAssembly; it allows compiling WebAssembly, not eval(). Header-only
  // directives (frame-ancestors) are set in Apache.
  security: {
    csp: {
      scriptDirective: { resources: ["'self'", "'wasm-unsafe-eval'", analytics] },
      styleDirective: {
        resources: ["'self'", { resource: "'unsafe-inline'", kind: 'attribute' }],
      },
      directives: [
        "default-src 'self'",
        "img-src 'self' data:",
        `connect-src 'self' ${analytics}`,
        "worker-src 'self' blob:",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'none'",
      ],
    },
  },
  devToolbar: { enabled: false },
});
