# Debug gallery (`debug/gallery.html`)

A visual-QA harness for the generator. It renders designs into **fixed-size
tiles** whose SVG `viewBox` equals their pixel size, so there is **no aspect /
scale distortion** — what you see is the design exactly as laid out.

> This is why the gallery (not the live `index.html`) is the QA tool: the live
> page uses `preserveAspectRatio="xMidYMid slice"`, which crops to cover the
> viewport. A headless screenshot of the live page at a window size that doesn't
> match the generation aspect will look mis-cropped — that's a screenshot
> artifact, not a layout bug. The gallery avoids it entirely.

## Running it

```sh
npm run dev          # builds (watch) + starts a static server, prints the port
# or: node build.mjs --serve
```

Then open `http://localhost:<port>/debug/gallery.html?<params>`.

The dev server auto-picks a free port (starting at `$PORT` or 8080) and logs it,
e.g. `dev server: http://localhost:8082`.

## Common options

These apply to every mode:

| param | default | meaning |
|-------|---------|---------|
| `w`   | `420`   | tile width, in design user units (also the SVG `width` and `viewBox` width) |
| `h`   | `300`   | tile height |

Because each tile's `viewBox` is `0 0 w h` and its `width`/`height` attributes
are also `w`/`h`, rendering is 1:1 — no distortion at any size.

## Modes

Exactly one mode runs per load. They are checked in this precedence order:
**`shot` → `gens` → `comps` → `exacts` → `exact`/default**. Each mode is selected
by the presence of its trigger param.

### 1. Random grid (default — no mode param)

A grid of random designs, seeded `<seed>-0`, `<seed>-1`, … Good for judging the
*typical* output across many seeds.

| param  | default     | meaning |
|--------|-------------|---------|
| `cols` | `4`         | columns |
| `rows` | `3`         | rows (total tiles = `cols × rows`) |
| `seed` | `gallery`   | seed prefix; tile *i* uses seed `<seed>-<i>` |

Tile label: the seed.

```
/debug/gallery.html?cols=5&rows=4&w=340&h=255&seed=mixA
```

### 2. `?exact=<seed>` — one specific seed, full tile

Renders a single design (1×1 grid) at `w × h`. Use to reproduce a reported seed.

| param | default | meaning |
|-------|---------|---------|
| `exact` | —     | the seed to render |

Tile label: the seed.

```
/debug/gallery.html?exact=1jcwkjk1chz&w=940&h=660
```

### 3. `?exacts=<seed1,seed2,…>` — a list of seeds

Renders each comma-separated seed as a labeled tile, in **one page load** (one
Chrome launch). Best for batch-reproducing a list of reported seeds. The label
includes the chosen composition name (read from the design's `data-composition`
attribute), e.g. `1jcwkjk1chz  [tracklist]`.

| param  | default | meaning |
|--------|---------|---------|
| `exacts` | —     | comma-separated seeds |
| `cols` | `2`     | columns |

```
/debug/gallery.html?exacts=1jcrexc6bod,1jcslncrvi,1jcswp812xf&cols=1&w=900&h=480
```

### 4. `?gens` — generator showcase

Renders **every registered generator** by name into a labeled tile (text
disabled; the generator fills the whole tile). Label: `name (category)`.

| param   | default | meaning |
|---------|---------|---------|
| `gens`  | —       | presence enables the mode (value ignored) |
| `cols`  | `4`     | columns |
| `from`  | `0`     | index of the first generator to render (alphabetical registration order) |
| `count` | `1000`  | how many generators to render — use with `from` to paginate |

```
/debug/gallery.html?gens=1&cols=4&w=330&h=240&from=0&count=28
```

### 5. `?comps` — composition showcase

Renders **every registered composition** by name into a labeled tile, using a
fixed seed per composition (so it's deterministic). Default uses Japanese text.
Label: `name`, or `name (no text)` when `notext` is set.

| param    | default | meaning |
|----------|---------|---------|
| `comps`  | —       | presence enables the mode (value ignored) |
| `notext` | (unset) | presence renders the **no-text** path of each composition |
| `cols`   | `4`     | columns |
| `from`   | `0`     | index of the first composition (alphabetical) |
| `count`  | `1000`  | how many to render — use with `from` to paginate |

```
/debug/gallery.html?comps=1&cols=4&w=350&h=240            # with text
/debug/gallery.html?comps=1&notext&cols=4&w=350&h=240     # no-text paths
```

### 6. `?shot=<seed>` — clean single design (for screenshots)

Renders one design filling the page with **no padding, label, or outline** —
just the design. Used to generate promo screenshots.

| param  | default | meaning |
|--------|---------|---------|
| `shot` | —       | the seed to render |

```
/debug/gallery.html?shot=promo-1&w=1280&h=800
```

## Headless screenshot recipe

```sh
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
"$CHROME" --headless=new --disable-gpu --hide-scrollbars \
  --window-size=1280,800 --virtual-time-budget=3000 \
  --screenshot=out.png \
  "http://localhost:<port>/debug/gallery.html?shot=<seed>&w=1280&h=800"
```

Notes:
- Set `--window-size` to match the tile/page size you requested (`w`,`h`) so the
  capture isn't padded.
- `--virtual-time-budget=<ms>` lets the page finish rendering (text measurement
  runs in the DOM) before the screenshot is taken.
- Rapid back-to-back `--headless=new` launches that share Chrome's default
  profile can occasionally drop a frame. For large reliable batches, give each
  launch its own `--user-data-dir=<tmp>` and verify each output file exists.
- For batches of *specific* seeds, prefer one `?exacts=a,b,c` load over many
  single launches — one Chrome process, no drops.

## Notes

- Every design SVG is tagged with `data-composition="<name>"` (set in
  `src/design.ts`), which the `exacts` mode surfaces in the tile label — handy
  for routing a reported seed to the right composition file.
- The gallery is built from `src/gallery.ts` into `gallery.js` by esbuild (a
  second entry point alongside `main.js`).
