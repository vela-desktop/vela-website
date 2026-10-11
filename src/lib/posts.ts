import { getCollection, type CollectionEntry } from 'astro:content';
import { slug } from 'github-slugger';

export type Post = CollectionEntry<'blog'>;

/**
 * Journal entries, newest first.
 *
 * Drafts are only included by the dev server, so they can be previewed
 * locally; production builds never generate pages, feeds or sitemap entries
 * for them.
 */
export async function getPosts(): Promise<Post[]> {
  const posts = await getCollection('blog', ({ data }) => import.meta.env.DEV || !data.draft);
  return posts.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}

export function postUrl(post: Post): string {
  return `/blog/${post.id}/`;
}

/** The page listing every entry with a tag: "Renderer" → /blog/topics/renderer/. */
export function topicUrl(tag: string): string {
  return `/blog/topics/${slug(tag)}/`;
}

/** The generated social preview image of an entry (src/pages/og/blog/). */
export function ogImageUrl(post: Post): string {
  return `/og/blog/${post.id}.png`;
}

const dateFormat = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

const shortDateFormat = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});

export function formatDate(date: Date): string {
  return dateFormat.format(date);
}

export function formatShortDate(date: Date): string {
  return shortDateFormat.format(date);
}

/** Minutes to read, from the raw Markdown body (~230 words per minute). */
export function readingTime(post: Post): number {
  const text = (post.body ?? '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[#>*_`\[\]()!-]/g, ' ');
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 230));
}

/**
 * A stable small number derived from a string. Used to vary the generated
 * covers of entries without images, so each one is composed differently but
 * never changes between builds.
 */
export function seed(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}
