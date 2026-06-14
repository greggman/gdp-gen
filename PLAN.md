# Plan: Graphic Design Poster Generator

## Goal
A static HTML page that renders a random, rule-driven graphic-design poster
(HTML/SVG) on load and on a refresh button. Built from TypeScript compiled by
esbuild, no runtime dependencies, Google TS Style.

## Tech & tooling
- **Build:** esbuild bundles `src/main.ts` -> `main.js` (IIFE, single file).
  `build.mjs` script with `--watch` + a tiny static file server for dev.
- **Style/lint:** Google TS Style via the `gts` dev dependency (config +
  formatter/linter only -- never shipped to the page).
- **Page:** `index.html` (loads `styles.css` + `main.js`), `styles.css`
  (modern CSS, nested rules), refresh button fixed top-right.
- **Reproducibility:** seedable PRNG; current seed written to the URL hash so
  any design can be reproduced/debugged.

## Directory layout
```
index.html  styles.css  package.json  tsconfig.json  build.mjs
src/
  main.ts                 # entry: wire refresh button, run generate()
  core/
    rng.ts                # seeded PRNG (mulberry32) + pick/weighted/range/gaussian/chance
    types.ts              # Design, Rect, Region, Palette, Composition, Generator
    registry.ts           # register + random-select compositions and generators
    context.ts            # DesignContext passed to compositions/generators
    renderer.ts           # SVG root setup, element/group helpers, mount to DOM
  color/
    colorSpaces.ts        # hsl <-> oklch conversions, parsing
    palette.ts            # harmony schemes + role assignment (bg/primary/accent/text)
    contrast.ts           # WCAG ratio, ensureContrast(), pickReadableColor()
  typography/
    scripts.ts            # Unicode ranges per script (CJK, Thai, Arabic, Devanagari, ...)
    textgen.ts            # made-up "words"/phrases per script (+ optional English)
    fonts.ts              # default web-font stacks (serif/sans/mono/system)
    fitText.ts            # measure, scale, wrap, and overflow handling w/ contrast
  layout/
    geometry.ts           # rect/point math, split, inset, rotate
    grid.ts               # grids, rule-of-thirds, golden ratio, modular scales
  compositions/
    _composition.ts       # interface + helpers
    index.ts              # imports & registers all
    *.ts                  # one file per algorithm (20+)
  generators/
    _generator.ts         # interface + helpers
    index.ts              # imports & registers all
    *.ts                  # one file per generator (100+)
debug/gallery.html        # renders N designs in a grid for visual QA
```

## Core design

**Render flow** (`main.ts` -> `generate()`):
1. Pick a seed -> `rng`.
2. Choose canvas/poster aspect (A-series, square, etc.).
3. Build a **palette**: random harmony scheme (mono / analogous / complementary
   / split-comp / triadic) -> assign roles (background, primary, accent, text)
   with contrast validation.
4. Choose **text settings**: text present? one world script, optionally +
   English; pick font stack.
5. Select a **composition** at random from the registry.
6. The composition partitions the canvas into regions and fills them with text
   blocks and **generators** (also pulled from the registry), all parameterized
   by `rng` under design rules.
7. Mount the SVG into the page.

**Interfaces:**
- `Composition { name; weight?; render(ctx: DesignContext): void }`
- `Generator { name; category; render(ctx, bounds: Rect, palette): SVGElement }`
- `DesignContext` carries `rng`, dimensions, palette, fonts, the SVG root, and
  helpers to place text and stamp generators.

**Rules baked into helpers (so every algorithm inherits them):**
- *Color:* harmony-based palettes; roles never clash; accent used sparingly.
- *Contrast:* any text checks WCAG ratio vs. its backdrop; if insufficient,
  swap to a readable color or add a backing shape.
- *Overflow:* text that runs past a region is clipped/bled intentionally and
  re-checked for contrast against whatever it crosses.
- *Parameterization:* each algorithm exposes randomized, sometimes dependent
  params (scale, density, rotation, margins) so repeats look different.

## Generator categories (to reach 100+)
Geometric tilings (stripes, checker, hex, triangles, diamonds, concentric) ·
halftone/dither · gradients (linear/radial/conic/mesh) · noise/grain · Bauhaus ·
Memphis · risograph overlap · op-art/moire · type-as-texture glyph fields ·
blobs/metaballs · Voronoi cells · sine/wave fields · scatter/confetti ·
isometric blocks · techno circuit lines (90s/2000s CD covers) · sunbursts/rays ·
spirals · arcs · contour/topographic · flow fields · crosshatch · Truchet tiles ·
gradient stripes · starfields, etc. Each is parameterized.

## Composition algorithms (22 planned, >=20 required)
Swiss/International grid · modular grid · diagonal grid · centered-symmetric ·
asymmetric rule-of-thirds · full-bleed generator + minimal type · duotone split
halves · horizontal bands · vertical columns · oversized "big type" (overflow
off edges) · corner-anchored · radial focal · magazine cover · dense concert
poster · airy museum/exhibit · tile-grid (each cell a generator) ·
framed/bordered · single manuscript block · scattered collage · Z/F
reading-flow · golden-spiral placement · diptych/triptych panels.

## Build phases
- **Phase 0 - Scaffold & build:** package.json, tsconfig, `build.mjs`
  (bundle/watch/serve), index.html, styles.css, refresh button, `main.ts` stub.
- **Phase 1 - Engine:** rng, types, registry, context, renderer, geometry, grid.
- **Phase 2 - Color:** colorSpaces, palette harmonies + role assignment, contrast.
- **Phase 3 - Typography:** script ranges, made-up text gen, font stacks,
  fitText + overflow/contrast.
- **Phase 4 - Composition framework + ~5 compositions** (prove the pipeline).
- **Phase 5 - Generator framework + ~10 generators** spanning several categories.
- **Phase 6 - Scale out** to 20+ compositions and 100+ generators.
- **Phase 7 - Polish:** refresh transition, seed-in-URL, optional PNG export,
  `debug/gallery.html`, QA sweep for contrast/overflow across many seeds.

## Verification
Visual + static. After each phase: `gts` lint/format clean, esbuild builds, dev
server runs, and the gallery page renders dozens of seeds without overlaps,
unreadable text, or broken overflow.
