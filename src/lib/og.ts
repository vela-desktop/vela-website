// Social preview images (1200×630) for journal entries without a cover.
//
// The background is the same composition the entry's generated cover uses on
// the site (see PostCover.astro): a crop of Vela's wallpaper whose position,
// zoom, mirroring and hue come from the entry's id. Satori lays out the text
// and returns it as SVG paths, so the result looks the same on any machine
// regardless of installed fonts; sharp renders both layers and merges them.
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import satori from 'satori';
import sharp from 'sharp';
import { formatDate, readingTime, seed, type Post } from './posts';
import iconSvg from '../assets/brand/vela_icon.svg?raw';
import wallpaperSvg from '../assets/brand/vela-wallpaper.svg?raw';

const WIDTH = 1200;
const HEIGHT = 630;

const require = createRequire(import.meta.url);
const font = (path: string) => readFile(require.resolve(`@fontsource/${path}`));

// Satori reads TTF, OTF and WOFF, not WOFF2 or variable fonts, so the static
// WOFF cuts come from Fontsource instead of src/assets/fonts/.
const fontsPromise = Promise.all([
  font('newsreader/files/newsreader-latin-400-normal.woff'),
  font('newsreader/files/newsreader-latin-400-italic.woff'),
  font('jetbrains-mono/files/jetbrains-mono-latin-500-normal.woff'),
]).then(([serif, serifItalic, mono]) => [
  { name: 'Newsreader', data: serif, weight: 400 as const, style: 'normal' as const },
  { name: 'Newsreader', data: serifItalic, weight: 400 as const, style: 'italic' as const },
  { name: 'JetBrains Mono', data: mono, weight: 500 as const, style: 'normal' as const },
]);

const logoPromise = sharp(Buffer.from(iconSvg), { density: 300 })
  .resize(96, 96)
  .png()
  .toBuffer()
  .then((png) => `data:image/png;base64,${png.toString('base64')}`);

/** The wallpaper crop, transformed the way PostCover.astro transforms it in CSS. */
async function background(id: string): Promise<Buffer> {
  const n = seed(id);
  const pick = (shift: number, range: number) => (((n >>> shift) % 1000) / 1000) * range;
  const originX = (20 + pick(0, 60)) / 100;
  const originY = (10 + pick(5, 50)) / 100;
  const scale = 1.15 + pick(10, 0.9);
  const hue = Math.round(-18 + pick(15, 36));
  const flip = (n & 1) !== 0;

  // Fill the frame (object-fit: cover) at 2× for a sharp crop.
  const frameW = WIDTH * 2;
  const frameH = HEIGHT * 2;
  const filled = await sharp(Buffer.from(wallpaperSvg), { density: 216 })
    .resize(frameW, frameH, { fit: 'cover' })
    .toBuffer();

  // Mirror around the center, then zoom in on the origin: the same result as
  // the CSS transform, which always fills the frame.
  const ox = originX * frameW;
  const oy = originY * frameH;
  const w = Math.round(frameW / scale);
  const h = Math.round(frameH / scale);
  const left = Math.round(ox - ox / scale);
  const top = Math.round(oy - oy / scale);

  const mirrored = flip ? await sharp(filled).flop().toBuffer() : filled;
  return sharp(mirrored)
    .extract({ left, top, width: w, height: h })
    .resize(WIDTH, HEIGHT)
    .modulate({ hue: (hue + 360) % 360, saturation: 1.1 })
    .png()
    .toBuffer();
}

type Node = { type: string; props: Record<string, unknown> };
const el = (type: string, style: Record<string, unknown>, children?: unknown, extra: Record<string, unknown> = {}): Node => ({
  type,
  props: { style, children, ...extra },
});

const mono = {
  fontFamily: 'JetBrains Mono',
  fontSize: 20,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
};

/** Title, labels and the shading that keeps them readable, as an SVG overlay. */
async function overlay(post: Post): Promise<string> {
  const { title, pubDate, tags } = post.data;
  const titleSize = title.length > 60 ? 64 : title.length > 36 ? 76 : 92;
  const meta = `${formatDate(pubDate)}  ·  ${readingTime(post)} min read`;

  // Satori adds padding to the declared size, so the frame is a fixed box and
  // the content sits inside it with margins.
  const content = el(
    'div',
    {
      flexGrow: 1,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      margin: '64px 72px',
    },
    [
      el('div', { display: 'flex', alignItems: 'center', justifyContent: 'space-between' }, [
        el('div', { display: 'flex', alignItems: 'center', gap: 20 }, [
          el('img', { width: 48, height: 48, borderRadius: 11 }, undefined, { src: await logoPromise, width: 48, height: 48 }),
          el('div', { ...mono, color: 'rgba(255, 255, 255, 0.9)' }, 'Vela Journal'),
        ]),
        tags[0]
          ? el(
              'div',
              {
                ...mono,
                fontSize: 18,
                color: '#46d6e0',
                padding: '8px 18px',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                borderRadius: 999,
                backgroundColor: 'rgba(2, 6, 12, 0.35)',
              },
              tags[0],
            )
          : el('div', {}),
      ]),
      el('div', { display: 'flex', flexDirection: 'column', gap: 28 }, [
        el(
          'div',
          {
            fontFamily: 'Newsreader',
            fontSize: titleSize,
            lineHeight: 1.04,
            letterSpacing: '-0.025em',
            maxWidth: 1000,
          },
          title,
        ),
        el('div', { display: 'flex', justifyContent: 'space-between', ...mono, color: '#a2b0c3' /* --text-muted */ }, [
          el('div', {}, meta),
          el('div', { textTransform: 'none', letterSpacing: '0.04em' }, 'velade.org'),
        ]),
      ]),
    ],
  );

  const tree = el(
    'div',
    {
      width: WIDTH,
      height: HEIGHT,
      display: 'flex',
      color: '#e8eef6', // --text
      backgroundImage:
        'linear-gradient(180deg, rgba(2, 6, 12, 0.35) 0%, rgba(2, 6, 12, 0.55) 45%, rgba(2, 6, 12, 0.9) 100%)',
    },
    [content],
  );

  return satori(tree as Parameters<typeof satori>[0], { width: WIDTH, height: HEIGHT, fonts: await fontsPromise });
}

/** The social preview image for one journal entry, as PNG. */
export async function renderOgImage(post: Post): Promise<Buffer> {
  const [base, text] = await Promise.all([background(post.id), overlay(post)]);
  return sharp(base)
    .composite([{ input: Buffer.from(text) }])
    .png({ compressionLevel: 9, palette: false })
    .toBuffer();
}
