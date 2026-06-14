/**
 * Warped grid: a regular grid of lines pushed around by a 2D sine displacement,
 * bending the straight rules into a rippled, lens-like op-art surface.
 */
import {registerGenerator} from '../core/registry.js';
import {DesignContext, Rect} from '../core/types.js';
import {baseFill, clipped, palettePair, svgEl} from './_generator.js';

function render(ctx: DesignContext, bounds: Rect): SVGElement {
  const {rng} = ctx;
  const {bg, fg} = palettePair(ctx, rng);
  const g = clipped(ctx, bounds);
  baseFill(g, bounds, bg);

  const cols = rng.int(8, 18);
  const rows = rng.int(8, 18);
  const cw = bounds.w / cols;
  const ch = bounds.h / rows;
  const stroke = Math.max(0.7, Math.min(bounds.w, bounds.h) * rng.range(0.0025, 0.006));
  const amp = Math.min(cw, ch) * rng.range(0.6, 1.4);
  const fx = (rng.range(1.5, 4) * Math.PI * 2) / bounds.w;
  const fy = (rng.range(1.5, 4) * Math.PI * 2) / bounds.h;
  const phase = rng.range(0, Math.PI * 2);

  const warpX = (x: number, y: number): number =>
    x + amp * Math.sin(fy * (y - bounds.y) + phase);
  const warpY = (x: number, y: number): number =>
    y + amp * Math.cos(fx * (x - bounds.x) + phase);

  const samples = 4; // sub-segments per cell edge for smooth curves
  let d = '';
  // Vertical lines.
  for (let c = 0; c <= cols; c++) {
    const x = bounds.x + c * cw;
    for (let s = 0; s <= rows * samples; s++) {
      const y = bounds.y + (s / samples) * ch;
      const px = warpX(x, y).toFixed(1);
      const py = warpY(x, y).toFixed(1);
      d += `${s === 0 ? 'M' : 'L'}${px} ${py}`;
    }
  }
  // Horizontal lines.
  for (let r = 0; r <= rows; r++) {
    const y = bounds.y + r * ch;
    for (let s = 0; s <= cols * samples; s++) {
      const x = bounds.x + (s / samples) * cw;
      const px = warpX(x, y).toFixed(1);
      const py = warpY(x, y).toFixed(1);
      d += `${s === 0 ? 'M' : 'L'}${px} ${py}`;
    }
  }
  g.appendChild(
    svgEl('path', {d, stroke: fg, 'stroke-width': stroke.toFixed(2), fill: 'none'}),
  );
  return g;
}

registerGenerator({name: 'warped-grid', category: 'lines', weight: 2, render});
