/** Triangle tiling: each grid cell split into two triangles of varied color. */
import {registerGenerator} from '../core/registry.js';
import {Color, DesignContext, Rect} from '../core/types.js';
import {baseFill, clipped, palettePair, svgEl} from './_generator.js';

function tri(points: number[], fill: Color): SVGPolygonElement {
  return svgEl('polygon', {points: points.join(' '), fill});
}

function render(ctx: DesignContext, bounds: Rect): SVGElement {
  const {rng, palette} = ctx;
  const {bg, fg} = palettePair(ctx, rng);
  const g = clipped(ctx, bounds);
  baseFill(g, bounds, bg);

  const cols = rng.int(3, 9);
  const cell = bounds.w / cols;
  const rows = Math.ceil(bounds.h / cell);
  const colors: Color[] = [fg, palette.accent, bg];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = bounds.x + c * cell;
      const y = bounds.y + r * cell;
      // Two triangles per cell, split along a random diagonal.
      if (rng.chance(0.5)) {
        g.appendChild(tri([x, y, x + cell, y, x, y + cell], rng.pick(colors)));
        g.appendChild(tri([x + cell, y, x + cell, y + cell, x, y + cell], rng.pick(colors)));
      } else {
        g.appendChild(tri([x, y, x + cell, y, x + cell, y + cell], rng.pick(colors)));
        g.appendChild(tri([x, y, x + cell, y + cell, x, y + cell], rng.pick(colors)));
      }
    }
  }
  return g;
}

registerGenerator({name: 'triangles', category: 'geometric', weight: 2, render});
