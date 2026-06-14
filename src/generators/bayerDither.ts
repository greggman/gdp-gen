/**
 * Bayer dither: an ordered 4x4 dither matrix tiled across the region with a
 * threshold ramp, producing crisp pixel-art-style gradient blocks.
 */
import {registerGenerator} from '../core/registry.js';
import {DesignContext, Rect} from '../core/types.js';
import {baseFill, clipped, palettePair, svgEl} from './_generator.js';

const BAYER4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];

function render(ctx: DesignContext, bounds: Rect): SVGElement {
  const {rng} = ctx;
  const {bg, fg} = palettePair(ctx, rng);
  const g = clipped(ctx, bounds);
  baseFill(g, bounds, bg);

  const cells = rng.int(16, 40);
  const cw = bounds.w / cells;
  const rows = Math.max(1, Math.round(bounds.h / cw));
  const vertical = rng.chance(0.5);
  const flip = rng.chance(0.5);

  let d = '';
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cells; c++) {
      const t = vertical ? r / rows : c / cells;
      const ramp = flip ? 1 - t : t;
      const threshold = (BAYER4[r % 4][c % 4] + 0.5) / 16;
      if (ramp <= threshold) continue;
      const x = (bounds.x + c * cw).toFixed(2);
      const y = (bounds.y + r * cw).toFixed(2);
      d += `M${x} ${y}h${cw.toFixed(2)}v${cw.toFixed(2)}h${(-cw).toFixed(2)}z`;
    }
  }
  g.appendChild(svgEl('path', {d, fill: fg, 'shape-rendering': 'crispEdges'}));
  return g;
}

registerGenerator({name: 'bayer-dither', category: 'dots', weight: 2, render});
