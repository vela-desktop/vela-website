import { getImage } from 'astro:assets';
import type { ImageMetadata } from 'astro';

export interface PictureSource {
  type: string;
  srcset: string;
  media?: string;
}

const FORMATS = [
  { format: 'avif', type: 'image/avif' },
  { format: 'webp', type: 'image/webp' },
] as const;

/**
 * Responsive <source> elements in modern formats for one image, optionally
 * scoped to a media query. Used where a <picture> needs art direction
 * (different crops per viewport), which <Picture> does not do on its own.
 */
export async function pictureSources(
  src: ImageMetadata,
  widths: number[],
  media?: string,
): Promise<PictureSource[]> {
  const usable = widths.filter((w) => w <= src.width);
  return Promise.all(
    FORMATS.map(async ({ format, type }) => {
      const image = await getImage({ src, widths: usable, format });
      return { type, media, srcset: image.srcSet.attribute };
    }),
  );
}

/** A fallback <img> URL (WebP) at a given width. */
export async function fallbackSrc(src: ImageMetadata, width: number): Promise<string> {
  const image = await getImage({ src, width: Math.min(width, src.width), format: 'webp' });
  return image.src;
}
