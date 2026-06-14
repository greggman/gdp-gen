/**
 * Truchet tiles: each cell holds two quarter-circle arcs in one of two random
 * orientations; together they form flowing maze-like curves.
 */
import {registerGenerator} from '../core/registry.js';
import {DesignContext, Rect} from '../core/types.js';
import {baseFill, clipped, palettePair, svgEl} from './_generator.js';

function render(ctx: DesignContext, bounds: Rect): SVGElement {
  const {rng} = ctx;
  const {bg, fg} = palettePair(ctx, rng);
  const g = clipped(ctx, bounds);
  baseFill(g, bounds, bg);

  const cols = rng.int(4, 12);
  const cell = bounds.w / cols;
  const rows = Math.ceil(bounds.h / cell);
  const sw = cell * rng.range(0.12, 0.3);
  const r = cell / 2;

  for (let row = 0; row < rows; row++) {
    for (let c = 0; c < cols; c++) {
      const x = bounds.x + c * cell;
      const y = bounds.y + row * cell;
      const arc = (cx: number, cy: number, sx: number, sy: number, ex: number, ey: number) =>
        g.appendChild(
          svgEl('path', {
            d: `M ${sx} ${sy} A ${r} ${r} 0 0 1 ${ex} ${ey}`,
            fill: 'none',
            stroke: fg,
            'stroke-width': sw,
          }),
        );
      if (rng.chance(0.5)) {
        arc(x, y, x + r, y, x, y + r); // top-left quarter
        arc(x + cell, y + cell, x + cell - r, y + cell, x + cell, y + cell - r); // bottom-right
      } else {
        arc(x + cell, y, x + cell - r, y, x + cell, y + r); // top-right
        arc(x, y + cell, x + r, y + cell, x, y + cell - r); // bottom-left
      }
    }
  }
  return g;
}

registerGenerator({name: 'truchet', category: 'geometric', weight: 2, render});
