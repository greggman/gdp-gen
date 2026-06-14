/** Checkerboard grid, optionally rotated, with adjustable cell size. */
import {registerGenerator} from '../core/registry.js';
import {DesignContext, Rect} from '../core/types.js';
import {baseFill, clipped, palettePair, svgEl} from './_generator.js';

function render(ctx: DesignContext, bounds: Rect): SVGElement {
  const {rng} = ctx;
  const {bg, fg} = palettePair(ctx, rng);
  const g = clipped(ctx, bounds);
  baseFill(g, bounds, bg);

  const cols = rng.int(3, 12);
  const cell = bounds.w / cols;
  const rows = Math.ceil(bounds.h / cell) + 1;
  const angle = rng.chance(0.3) ? rng.pick([45, 30, 15]) : 0;
  const cx = bounds.x + bounds.w / 2;
  const cy = bounds.y + bounds.h / 2;

  const grid = svgEl(
    'g',
    angle ? {transform: `rotate(${angle} ${cx} ${cy})`} : {},
  );
  const pad = angle ? cell * 2 : 0;
  for (let r = -1; r < rows + 1; r++) {
    for (let c = -1; c < cols + 1; c++) {
      if ((r + c) % 2 !== 0) continue;
      grid.appendChild(
        svgEl('rect', {
          x: bounds.x + c * cell - pad,
          y: bounds.y + r * cell - pad,
          width: cell,
          height: cell,
          fill: fg,
        }),
      );
    }
  }
  g.appendChild(grid);
  return g;
}

registerGenerator({name: 'checkerboard', category: 'geometric', weight: 2, render});
