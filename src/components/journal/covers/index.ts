// Covers drawn for particular journal entries, by entry id. PostCover.astro
// uses them for entries without a `cover` image of their own, and falls back
// to a crop of Vela's wallpaper for the rest.
//
// A cover should add something the title doesn't say: technical entries get a
// diagram of the mechanism they explain, drawn from the entry's own numbers;
// the others get real captures of Vela (Screenshot.astro).
import FrameClock from './FrameClock.astro';
import SlowApps from './SlowApps.astro';
import OwnRenderer from './OwnRenderer.astro';
import Sound from './Sound.astro';
import Screenshot from './Screenshot.astro';
import start from '../../../assets/screenshots/start.webp';
import files from '../../../assets/screenshots/files.webp';
import light from '../../../assets/screenshots/light.webp';

export interface EntryCover {
  // Astro components have no narrower public type.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  component: (props: any) => any;
  props?: Record<string, unknown>;
  /** Screenshots get the size hints for responsive images; diagrams don't need them. */
  image?: boolean;
}

export const ENTRY_COVERS: Record<string, EntryCover> = {
  'frame-clock': { component: FrameClock },
  'slow-apps': { component: SlowApps },
  'own-renderer': { component: OwnRenderer },
  'sound': { component: Sound },
  'why-vela': { component: Screenshot, props: { src: start }, image: true },
  'about-customization': { component: Screenshot, props: { src: files, light }, image: true },
};
