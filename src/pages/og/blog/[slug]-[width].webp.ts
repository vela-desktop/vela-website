import type { APIRoute, GetStaticPaths } from 'astro';
import { OG_COVER_WIDTHS, getPosts, type Post } from '../../../lib/posts';
import { renderOgCover } from '../../../lib/og';

// The social preview image as WebP at the widths the journal's covers use
// (PostCover.astro), for entries without a cover of their own.
export const getStaticPaths = (async () => {
  const posts = await getPosts();
  return posts
    .filter((post) => !post.data.cover)
    .flatMap((post) =>
      OG_COVER_WIDTHS.map((width) => ({ params: { slug: post.id, width: String(width) }, props: { post, width } })),
    );
}) satisfies GetStaticPaths;

export const GET: APIRoute<{ post: Post; width: number }> = async ({ props }) =>
  new Response(new Uint8Array(await renderOgCover(props.post, props.width)), {
    headers: { 'Content-Type': 'image/webp' },
  });
