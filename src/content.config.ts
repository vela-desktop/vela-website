import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

/**
 * The development journal.
 *
 * One entry per file in src/content/blog/: either `my-post.md(x)` or
 * `my-post/index.md(x)` with its images next to it. The file or folder name
 * becomes the URL: /blog/my-post/.
 */
const blog = defineCollection({
  loader: glob({ pattern: '**/[^_]*.{md,mdx}', base: './src/content/blog' }),
  schema: ({ image }) =>
    z
      .object({
        title: z.string().min(1),
        seoTitle: z.string().min(1).optional(),
        description: z.string().min(1),
        pubDate: z.coerce.date(),
        updatedDate: z.coerce.date().optional(),
        draft: z.boolean().default(false),
        cover: image().optional(),
        coverAlt: z.string().optional(),
        tags: z.array(z.string().min(1)).default([]),
      })
      .refine((post) => !post.cover || typeof post.coverAlt === 'string', {
        message: 'coverAlt is required when a cover image is set (use "" only for purely decorative covers).',
        path: ['coverAlt'],
      }),
});

/**
 * Translations of journal entries.
 *
 * src/content/translations/<lang>/<entry>.md(x), where <entry> is the id of
 * the original in src/content/blog/: it/frame-clock.mdx → /it/blog/frame-clock/.
 * Tags and cover come from the original; the rest is the translation's own.
 */
const translations = defineCollection({
  loader: glob({ pattern: '*/**/[^_]*.{md,mdx}', base: './src/content/translations' }),
  schema: z.object({
    title: z.string().min(1),
    seoTitle: z.string().min(1).optional(),
    description: z.string().min(1),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    draft: z.boolean().default(false),
    coverAlt: z.string().optional(),
  }),
});

export const collections = { blog, translations };
