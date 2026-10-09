import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getPosts, postUrl } from '../lib/posts';
import { SITE } from '../consts';

export async function GET(context: APIContext) {
  const posts = (await getPosts()).filter((post) => !post.data.draft);
  return rss({
    title: 'Vela Journal',
    description: 'Long-form notes from the development of Vela, a modern Linux desktop environment.',
    site: context.site ?? SITE.url,
    trailingSlash: true,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.pubDate,
      link: postUrl(post),
      categories: post.data.tags,
    })),
    customData: '<language>en</language>',
  });
}
