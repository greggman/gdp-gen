/**
 * Grid glitch: a clean grid of cells that has been digitally corrupted. Random
 * horizontal scan bands are sliced out and shifted sideways, some cells are
 * displaced or duplicated as channel-split echoes, and stray bright slivers cut
 * across -- the look of a datamosh or signal dropout over a regular grid.
 */
import {registerGenerator} from '../core/registry.js';
import {DesignContext, Rect} from '../core/types.js';
import {baseFill, clipped, palettePair, svgEl} from './_generator.js';

function render(ctx: DesignContext, bounds: Rect): SVGElement {
  const {rng, palette} = ctx;
  const {bg, fg} = palettePair(ctx, rng);
  const echo = palette.accent === fg ? palette.primary : palette.accent;
  const g = clipped(ctx, bounds);
  baseFill(g, bounds, bg);

  const aspect = bounds.w / bounds.h;
  const base = rng.int(8, 14);
  const cols = Math.max(5, Math.round(base * Math.sqrt(aspect)));
  const rows = Math.max(5, Math.round(base / Math.sqrt(aspect)));
  const cw = bounds.w / cols;
  const ch = bounds.h / rows;

  // Per-row horizontal shift bands (the glitch displacement).
  const shift: number[] = [];
  for (let r = 0; r < rows; r++) {
    shift[r] = rng.chance(0.3) ? rng.range(-0.5, 0.5) * cw * rng.int(1, 5) : 0;
  }

  let main = '';
  let echoes = '';
  for (let r = 0; r < rows; r++) {
    const sy = bounds.y + r * ch;
    for (let c = 0; c < cols; c++) {
      // Base checker-ish fill that the glitch acts on.
      if ((r + c) % 2 === 0 && !rng.chance(0.15)) {
        const x = bounds.x + c * cw + shift[r];
        main += `M${x.toFixed(2)} ${sy.toFixed(2)}h${cw.toFixed(2)}v${ch.toFixed(2)}h-${cw.toFixed(2)}z`;
      }
      // Occasional displaced echo cell in the accent color.
      if (rng.chance(0.06)) {
        const x = bounds.x + c * cw + rng.range(-1.5, 1.5) * cw;
        const y = sy + rng.range(-0.4, 0.4) * ch;
        echoes += `M${x.toFixed(2)} ${y.toFixed(2)}h${cw.toFixed(2)}v${ch.toFixed(2)}h-${cw.toFixed(2)}z`;
      }
    }
  }
  g.appendChild(svgEl('path', {d: main, fill: fg}));
  g.appendChild(svgEl('path', {d: echoes, fill: echo, 'fill-opacity': 0.85}));

  // A few bright horizontal slivers slicing across the whole width.
  const slivers = rng.int(2, 5);
  for (let i = 0; i < slivers; i++) {
    const y = bounds.y + rng.range(0, 1) * bounds.h;
    const h = Math.max(1, ch * rng.range(0.08, 0.3));
    g.appendChild(
      svgEl('rect', {
        x: bounds.x,
        y,
        width: bounds.w,
        height: h,
        fill: rng.chance() ? fg : echo,
        'fill-opacity': rng.range(0.5, 0.9),
      }),
    );
  }
  return g;
}

registerGenerator({name: 'grid-glitch', category: 'digital', weight: 2, render});
