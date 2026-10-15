import type { APIRoute, GetStaticPaths } from 'astro';
import { getPosts, getTranslations, ogImageUrl, type Entry } from '../../../lib/posts';
import { renderOgImage } from '../../../lib/og';

// Entries with their own cover use it as the preview image instead. The path
// is the one ogImageUrl() gives: <id>.png, or <lang>/<id>.png for translations.
export const getStaticPaths = (async () => {
  const entries: Entry[] = [...(await getPosts()), ...(await getTranslations())];
  return entries
    .filter((post) => !post.data.cover)
    .map((post) => ({ params: { slug: ogImageUrl(post).replace(/^\/og\/blog\/|\.png$/g, '') }, props: { post } }));
}) satisfies GetStaticPaths;

export const GET: APIRoute<{ post: Entry }> = async ({ props }) =>
  new Response(new Uint8Array(await renderOgImage(props.post)), {
    headers: { 'Content-Type': 'image/png' },
  });
