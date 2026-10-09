// @ts-check
import { defineConfig, fontProviders } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { satteri } from '@astrojs/markdown-satteri';
import { headingAnchors, tableWrap } from './src/lib/markdown-plugins.mjs';

export default defineConfig({
  site: 'https://velade.org',
  trailingSlash: 'always',
  build: { format: 'directory' },
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
    sitemap({ filter: (page) => !page.endsWith('/404/') }),
  ],
  markdown: {
    processor: satteri({ hastPlugins: [headingAnchors, tableWrap] }),
    shikiConfig: {
      // Colors come from CSS custom properties in src/styles/prose.css,
      // so code blocks follow the site's tokens.
      theme: 'css-variables',
      wrap: false,
    },
  },
  devToolbar: { enabled: false },
});
