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

export const collections = { blog };
