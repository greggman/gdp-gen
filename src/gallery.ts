/**
 * Debug gallery: renders a grid of designs at fixed tile sizes for visual QA.
 * Each tile's SVG viewBox equals its pixel size, so there is no aspect/scale
 * distortion -- what you see is the design exactly as laid out.
 *
 * Query params: ?cols=4&rows=3&w=420&h=300&seed=foo
 */
import {buildDesign} from './design.js';
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

/** Renders every registered generator by name into a labeled tile. */
function showcaseGenerators(w: number, h: number, cols: number): void {
  const grid = document.createElement('div');
  grid.style.cssText =
    `display:grid;gap:10px;padding:10px;` +
    `grid-template-columns:repeat(${cols}, ${w}px);background:#222`;

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

/** Renders every registered composition by name into a labeled tile. */
function showcaseCompositions(w: number, h: number, cols: number, textEnabled: boolean): void {
  const grid = document.createElement('div');
  grid.style.cssText =
    `display:grid;gap:10px;padding:10px;` +
    `grid-template-columns:repeat(${cols}, ${w}px);background:#222`;

  const from = param('from', 0);
  const count = param('count', 1000);
  for (const comp of allCompositions().slice(from, from + count)) {
    const rng = makeRng(`comp-${comp.name}`);
    const root = createRoot(w, h);
    const ctx = new Context({
      rng,
      width: w,
      height: h,
      palette: generatePalette(rng),
      text: {enabled: textEnabled, script: 'japanese', withEnglish: false, font: pickFont(rng, scriptByName('japanese'))},
      root,
    });
    comp.render(ctx);
    root.setAttribute('width', String(w));
    root.setAttribute('height', String(h));

    const cell = document.createElement('div');
    cell.style.cssText = 'position:relative;outline:1px solid #444';
    cell.appendChild(root);
    const tag = document.createElement('div');
    tag.textContent = comp.name + (textEnabled ? '' : ' (no text)');
    tag.style.cssText =
      'position:absolute;bottom:2px;left:4px;font:10px monospace;' +
      'color:#fff;background:rgba(0,0,0,.6);padding:0 3px';
    cell.appendChild(tag);
    grid.appendChild(cell);
  }
  document.body.appendChild(grid);
}

function init(): void {
  const params = new URLSearchParams(location.search);
  const w = param('w', 420);
  const h = param('h', 300);
  // Clean single-design render for promo screenshots: just the design, filling
  // the page, with no padding/label/outline.
  const shot = params.get('shot');
  if (shot) {
    document.body.style.margin = '0';
    const svg = buildDesign(shot, w, h);
    svg.setAttribute('width', String(w));
    svg.setAttribute('height', String(h));
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    svg.style.display = 'block';
    document.body.appendChild(svg);
    return;
  }
  if (params.get('gens') !== null) {
    showcaseGenerators(w, h, param('cols', 4));
    return;
  }
  if (params.get('comps') !== null) {
    showcaseCompositions(w, h, param('cols', 4), params.get('notext') === null);
    return;
  }
  // Render a specific list of seeds (comma-separated) as labeled tiles.
  const exacts = params.get('exacts');
  if (exacts) {
    const cols = param('cols', 2);
    const grid = document.createElement('div');
    grid.style.cssText =
      `display:grid;gap:10px;padding:10px;grid-template-columns:repeat(${cols}, ${w}px);background:#222`;
    for (const seed of exacts.split(',')) {
      const svg = buildDesign(seed, w, h);
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
  // `exact` renders one specific seed full-size for debugging a single design.
  const cols = exact ? 1 : param('cols', 4);
  const rows = exact ? 1 : param('rows', 3);
  const seedBase = params.get('seed') ?? 'gallery';

  const grid = document.createElement('div');
  grid.style.cssText =
    `display:grid;gap:10px;padding:10px;` +
    `grid-template-columns:repeat(${cols}, ${w}px);background:#222`;

  for (let i = 0; i < cols * rows; i++) {
    const seed = exact ?? `${seedBase}-${i}`;
    const svg = buildDesign(seed, w, h);
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
