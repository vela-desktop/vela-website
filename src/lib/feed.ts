import rss from '@astrojs/rss';
import { render } from 'astro:content';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { loadRenderers } from 'astro:container';
import { getContainerRenderer as getMDXRenderer } from '@astrojs/mdx/container-renderer';
import { getPosts, getTranslations, postUrl } from './posts';
import { DEFAULT_LANG, FEEDS, tagName, type Lang } from './i18n';
import { SITE } from '../consts';

/**
 * Feed readers show the HTML on its own, away from the site: links and images
 * need absolute URLs, the parts that only work with the site's CSS and
 * scripts (heading self-links, scoped-style attributes) are dropped, and
 * asides become quotes with a bold title, which every reader can show.
 */
function forFeed(html: string, site: URL): string {
  const absolute = (url: string) => (url.startsWith('/') && !url.startsWith('//') ? new URL(url, site).href : url);
  return html
    .replace(/<a href="#[^"]*" class="heading-anchor"[^>]*><\/a>/g, '')
    .replace(/\sdata-astro-cid-[\w-]+(="[^"]*")?/g, '')
    .replace(/<aside class="aside[^"]*">([\s\S]*?)<\/aside>/g, (_, inner: string) =>
      `<blockquote>${inner
        .replace(/<p class="aside__title">([\s\S]*?)<\/p>/, '<p><strong>$1</strong></p>')
        .replace(/<div class="aside__body">([\s\S]*)<\/div>/, '$1')}</blockquote>`,
    )
    .replace(/\s(href|src)="([^"]*)"/g, (_, attr: string, url: string) => ` ${attr}="${absolute(url)}"`)
    .replace(/\ssrcset="([^"]*)"/g, (_, srcset: string) =>
      ` srcset="${srcset
        .split(',')
        .map((candidate) => candidate.trim().replace(/^\S+/, absolute))
        .join(', ')}"`,
    );
}

/** The journal's feed in one language: the originals in English, the translations in the others. */
export async function journalFeed(lang: Lang, site: URL = new URL(SITE.url)): Promise<Response> {
  const entries =
    lang === DEFAULT_LANG
      ? (await getPosts()).filter((post) => !post.data.draft).map((post) => ({ post, entry: post }))
      : (await getTranslations(lang)).filter((post) => !post.data.draft).map((post) => ({ post, entry: post.entry }));
  const container = await AstroContainer.create({ renderers: await loadRenderers([getMDXRenderer()]) });

  const items = await Promise.all(
    entries.map(async ({ post, entry }) => {
      const { Content } = await render(entry);
      return {
        title: post.data.title,
        description: post.data.description,
        pubDate: post.data.pubDate,
        link: postUrl(post),
        categories: post.data.tags.map((tag) => tagName(tag, lang)),
        content: forFeed(await container.renderToString(Content), site),
      };
    }),
  );

  return rss({
    ...FEEDS[lang],
    site,
    trailingSlash: true,
    items,
    customData: `<language>${lang}</language>`,
  });
}
