# Design notes — velade.org

The direction is **Engineering in Motion**: the site opens like a product film and
settles into an independent technology journal. Both halves share one system —
the same tokens, grid, labels and motion — so the shift feels like a change of
voice, not a change of site.

## Principles

1. **The desktop is the hero.** Every screenshot is an unretouched capture from the
   Vela repository. Crops are allowed (to focus on a detail); fabricated UI is not.
   Overlays never cover the interface: the hero callouts sit on empty wallpaper.
2. **Claims come with sources.** Numbers and behaviours on the site are taken from
   the Vela README and `docs/renderer.md`, with the measuring system named.
3. **Diagrams explain mechanisms.** The vblank timeline, the pixel grid (its
   "resampled" half is computed with real bilinear filtering at 125%) and the stack
   illustrate documented behaviour; nothing decorative pretends to be data.
4. **Efficiency through architecture.** Static HTML, ~1.4 KB of inline JavaScript, AVIF/WebP
   at responsive widths, self-hosted fonts with metric-matched fallbacks (CLS 0).
   Richness comes from composition and type, not from runtime weight.
5. **Honest states.** Alpha status is visible in the header, hero, status block and
   footer. With no journal entries, the journal says so and points to the commit
   history and the roadmap; nothing is invented to fill space.

## The journey

| # | Section | Voice | Composition |
|---|---|---|---|
| 01 | Hero | cinematic | Vela's own wallpaper (vector) dissolving into ink; staircase headline *Modern. Fluid. Sharp.*; the desktop rises into focus; technical-drawing callouts; spec strip |
| 02 | The desktop | product-editorial | five compositions, each different: layered close-up (Snap), offset pair (Task View + Alt+Tab), interactive light/dark split, sticky image + indexed list (shell), full-bleed lock screen fading into the next chapter |
| 03 | Philosophy | graphic-editorial | serif manifesto, faint 12-column grid made visible, three principles with mirrored layouts, horizontal pipeline, measured figures |
| 04 | Journal | publication | warmer "paper" ground, serif headlines, feature + cards + index that adapt to 0 / 1 / 2 / 3 / many entries |
| 05 | Open source | closing | status block, three paths (try, follow, contribute), the repository as a giant link; the wallpaper returns, mirrored, to bookend the hero |

## Tokens (`src/styles/tokens.css`)

**Color** — from the wallpaper. Ink scale `--ink-0…4` (#02060c → #12243a),
`--navy` #06182d (Vela's desktop color), `--paper` #0a1019 for the journal.
Accents: `--accent` #8cc8ff for links and focus, `--teal` #46d6e0 for labels and
light, `--coral` #ff9158 only for the alpha marker and drafts — the wallpaper's
single warm spark. Text: `--text`, `--text-muted`, `--text-faint` (all ≥ 4.5:1 on ink).

**Type** — four roles, never a family name in a component:

| Role | Default | Used for |
|---|---|---|
| `--font-display` | Instrument Sans (wdth 84 for the largest sizes) | headlines, big numbers |
| `--font-body` | Instrument Sans | interface and running text |
| `--font-serif` | Newsreader | the editorial voice: manifesto, journal, article prose |
| `--font-mono` | JetBrains Mono | labels, metadata, code |

Fluid scale `--step--2 … --step-6` plus `--step-hero`; all `clamp()`-based.

**Space & layout** — `--space-3xs … --space-3xl`, `--space-section` between
chapters; `--gutter`; widths `--width-page` (1440), `--width-content`,
`--measure` (~68 characters). Compositions use a 12-column grid.

**Shape & light** — radii `--radius-xs … xl` (8 px is Vela's own overlay radius);
`--shadow-window` for screenshots; teal/blue radial glows.

**Motion** — `--ease-decelerate` `cubic-bezier(0, 0, 0.2, 1)` and
`--ease-accelerate` are Vela's own curves, with its 120 / 200 / 250 ms durations
(`common/controls/Theme.qml`): the site moves the way the desktop does. Longer
reveals use `--ease-expressive`. Under `prefers-reduced-motion` every duration
is 0 and nothing is hidden.

## Motion inventory

- Hero entrance, once: words rise, the screenshot comes **into focus** (blur → sharp),
  callout lines draw. Pure CSS.
- The hero display flattens as the page scrolls (`animation-timeline: scroll()`
  where supported; static elsewhere).
- Reveal on scroll via IntersectionObserver; content is only hidden when JS runs
  and motion is welcome.
- The vblank timeline steps with `steps()` — one jump per tick.
- Cross-document view transitions (`@view-transition`), link underlines, card
  zoom on hover. No scroll hijacking, no parallax layers, no loops besides the
  small timeline.

## Typography is meant to change

Fonts are registered once in `astro.config.mjs` (Astro Fonts API, local files in
`src/assets/fonts/`). To try another typeface, replace the files and the `name`
in the relevant entry — or switch that entry to `fontProviders.fontsource()`,
which downloads and self-hosts at build time. Tokens and components stay as
they are. Newsreader ships as its weight-only variable font: the optical-size
version looked slightly crisper at display sizes but cost ~150 KB more per visit.

## Assets

Screenshots, the logo and the wallpaper come from the Vela repository
(GPL-3.0-or-later). `vela-wallpaper.svg` is `images/vela_splash_169.svg` with its
intrinsic size corrected to match its viewBox; `start-menu-crop.webp` and
`alt-tab-crop.webp` are crops of the original captures. The journal's end mark
redraws the Start button's sail from `shell/qml/StartGlyph.qml`. Covers for
entries without an image are cut from the wallpaper, with a hue shift of at most
±18° derived from the entry's id.
