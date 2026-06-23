/**
 * Debug gallery: renders a grid of designs at fixed tile sizes for visual QA.
 * Each tile's SVG viewBox equals its pixel size, so there is no aspect/scale
 * distortion -- what you see is the design exactly as laid out.
 *
 * Query params: ?cols=4&rows=3&w=420&h=300&seed=foo
 */
import {buildDesign, parseTextParams} from './design.js';
import {generatePalette} from './color/palette.js';
import {Context} from './core/context.js';
import {makeRng} from './core/rng.js';
import {allCompositions, allGenerators} from './core/registry.js';
import {createRoot} from './core/renderer.js';
import {pickFont} from './typography/fonts.js';
import {scriptByName} from './typography/scripts.js';

function param(name: string, fallback: number): number {
  const v = new URLSearchParams(location.search).get(name);
  const n = v === null ? NaN : Number(v);
  return Number.isFinite(n) ? n : fallback;
}

/** A wrapping grid of fixed-width tiles -- columns fill to the viewport width,
 * so there's no `cols` to specify. */
function gridStyle(w: number): string {
  return (
    `display:grid;gap:10px;padding:10px;justify-content:start;` +
    `grid-template-columns:repeat(auto-fill, ${w}px);background:#222`
  );
}

/** Renders every registered generator by name into a labeled tile. */
function showcaseGenerators(w: number, h: number): void {
  const grid = document.createElement('div');
  grid.style.cssText = gridStyle(w);

  const from = param('from', 0);
  const count = param('count', 1000);
  for (const gen of allGenerators().slice(from, from + count)) {
    const rng = makeRng(`gen-${gen.name}`);
    const root = createRoot(w, h);
    const ctx = new Context({
      rng,
      width: w,
      height: h,
      palette: generatePalette(rng),
      text: {enabled: false, script: 'latin', withEnglish: false, font: pickFont(rng, scriptByName('latin'))},
      root,
    });
    root.appendChild(ctx.fillRegion({x: 0, y: 0, w, h}, undefined, gen.name));
    root.setAttribute('width', String(w));
    root.setAttribute('height', String(h));

    const cell = document.createElement('div');
    cell.style.cssText = 'position:relative;outline:1px solid #444';
    cell.appendChild(root);
    const tag = document.createElement('div');
    tag.textContent = `${gen.name} (${gen.category})`;
    tag.style.cssText =
      'position:absolute;bottom:2px;left:4px;font:10px monospace;' +
      'color:#fff;background:rgba(0,0,0,.6);padding:0 3px';
    cell.appendChild(tag);
    grid.appendChild(cell);
  }
  document.body.appendChild(grid);
}

/**
 * Renders each registered composition through the real design pipeline (random
 * script/palette per seed -- not always Japanese), forcing the composition.
 * Each tile links to the full-page render of that exact seed.
 *
 * Params: from, count, samples (tiles per composition, default 1),
 * `rand` (use a fresh random seed per tile -- reload for fresh examples),
 * `notext` (force the no-text path), `comp` (a single composition by name).
 */
function showcaseCompositions(w: number, h: number): void {
  const params = new URLSearchParams(location.search);
  const textOpts = parseTextParams(params);
  const from = param('from', 0);
  const count = param('count', 1000);
  const samples = Math.max(1, param('samples', 1));
  const rand = params.get('rand') !== null;
  const wantText = params.get('notext') === null;
  const only = params.get('comp'); // restrict to a single composition by name

  const grid = document.createElement('div');
  grid.style.cssText = gridStyle(w);

  const list = only
    ? allCompositions().filter(c => c.name === only)
    : allCompositions().slice(from, from + count);

  // Mistyped comp name -> show the valid names rather than a blank page.
  if (only && list.length === 0) {
    const msg = document.createElement('pre');
    msg.style.cssText = 'color:#fff;background:#222;margin:0;padding:16px;font:13px monospace;white-space:pre-wrap';
    msg.textContent =
      `No composition named "${only}". Valid names:\n\n` +
      allCompositions()
        .map(c => c.name)
        .sort()
        .join('\n');
    document.body.appendChild(msg);
    return;
  }

  for (const comp of list) {
    for (let s = 0; s < samples; s++) {
      const seed = rand ? Math.random().toString(36).slice(2, 9) : `${comp.name}-${s}`;
      const svg = buildDesign(seed, w, h, {
        composition: comp.name,
        textEnabled: wantText ? undefined : false,
        ...textOpts,
      });
      svg.setAttribute('width', String(w));
      svg.setAttribute('height', String(h));
      svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
      svg.style.display = 'block';

      // Wrap in a link to the full-page render of this exact seed + composition.
      const a = document.createElement('a');
      a.href = `../index.html#${seed}~${comp.name}`;
      a.style.cssText = 'position:relative;display:block;outline:1px solid #444';
      a.appendChild(svg);
      const tag = document.createElement('div');
      tag.textContent = comp.name + (wantText ? '' : ' (no text)');
      tag.style.cssText =
        'position:absolute;bottom:2px;left:4px;font:10px monospace;' +
        'color:#fff;background:rgba(0,0,0,.6);padding:0 3px';
      a.appendChild(tag);
      grid.appendChild(a);
    }
  }
  document.body.appendChild(grid);
}

function init(): void {
  const params = new URLSearchParams(location.search);
  const textOpts = parseTextParams(params);
  const w = param('w', 420);
  const h = param('h', 300);
  // Clean single-design render for promo screenshots: just the design, filling
  // the page, with no padding/label/outline.
  const shot = params.get('shot');
  if (shot) {
    document.body.style.margin = '0';
    const svg = buildDesign(shot, w, h, textOpts);
    svg.setAttribute('width', String(w));
    svg.setAttribute('height', String(h));
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    svg.style.display = 'block';
    document.body.appendChild(svg);
    return;
  }
  if (params.get('gens') !== null) {
    showcaseGenerators(w, h);
    return;
  }
  if (params.get('comps') !== null) {
    showcaseCompositions(w, h);
    return;
  }
  // Render a specific list of seeds (comma-separated) as labeled tiles.
  const exacts = params.get('exacts');
  if (exacts) {
    const grid = document.createElement('div');
    grid.style.cssText = gridStyle(w);
    for (const seed of exacts.split(',')) {
      const svg = buildDesign(seed, w, h, textOpts);
      svg.setAttribute('width', String(w));
      svg.setAttribute('height', String(h));
      svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
      const cell = document.createElement('div');
      cell.style.cssText = 'position:relative;outline:1px solid #444';
      cell.appendChild(svg);
      const tag = document.createElement('div');
      tag.textContent = `${seed}  [${svg.getAttribute('data-composition') ?? '?'}]`;
      tag.style.cssText =
        'position:absolute;bottom:2px;right:4px;font:11px monospace;color:#fff;background:rgba(0,0,0,.6);padding:0 3px';
      cell.appendChild(tag);
      grid.appendChild(cell);
    }
    document.body.appendChild(grid);
    return;
  }

  const exact = params.get('exact');
  // `exact` renders one specific seed; otherwise `count` random designs that wrap
  // to the viewport width.
  const n = exact ? 1 : param('count', 12);
  const seedBase = params.get('seed') ?? 'gallery';

  const grid = document.createElement('div');
  grid.style.cssText = gridStyle(w);

  for (let i = 0; i < n; i++) {
    const seed = exact ?? `${seedBase}-${i}`;
    const svg = buildDesign(seed, w, h, textOpts);
    svg.setAttribute('width', String(w));
    svg.setAttribute('height', String(h));
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    const cell = document.createElement('div');
    cell.style.cssText = 'position:relative;outline:1px solid #444';
    cell.appendChild(svg);
    const tag = document.createElement('div');
    tag.textContent = seed;
    tag.style.cssText =
      'position:absolute;bottom:2px;right:4px;font:10px monospace;' +
      'color:#fff;background:rgba(0,0,0,.5);padding:0 3px';
    cell.appendChild(tag);
    grid.appendChild(cell);
  }
  document.body.appendChild(grid);
}

init();
