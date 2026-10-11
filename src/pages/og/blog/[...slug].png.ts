import type { APIRoute, GetStaticPaths } from 'astro';
import { getPosts, type Post } from '../../../lib/posts';
import { renderOgImage } from '../../../lib/og';

// Entries with their own cover use it as the preview image instead.
export const getStaticPaths = (async () => {
  const posts = await getPosts();
  return posts.filter((post) => !post.data.cover).map((post) => ({ params: { slug: post.id }, props: { post } }));
}) satisfies GetStaticPaths;

export const GET: APIRoute<{ post: Post }> = async ({ props }) =>
  new Response(new Uint8Array(await renderOgImage(props.post)), {
    headers: { 'Content-Type': 'image/png' },
  });
