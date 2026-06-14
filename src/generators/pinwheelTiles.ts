/**
 * Pinwheel tiling: a grid of square blocks, each carved into four congruent
 * right triangles that spiral around the block center, all sharing the same
 * handedness so the field reads as a sea of little rotating pinwheels.
 */
import {registerGenerator} from '../core/registry.js';
import {DesignContext, Rect} from '../core/types.js';
import {baseFill, clipped, palettePair, svgEl} from './_generator.js';

function render(ctx: DesignContext, bounds: Rect): SVGElement {
  const {rng} = ctx;
  const {bg, fg} = palettePair(ctx, rng);
  const g = clipped(ctx, bounds);
  baseFill(g, bounds, bg);

  const cols = rng.int(3, 7);
  const cell = bounds.w / cols;
  const rows = Math.ceil(bounds.h / cell) + 1;
  // Each pinwheel triangle has an apex at an edge midpoint offset; flip the
  // diagonal per parity-free choice so all blocks spin the same way.
  let d = '';
  for (let r = -1; r < rows; r++) {
    for (let c = -1; c <= cols; c++) {
      const x = bounds.x + c * cell;
      const y = bounds.y + r * cell;
      const m = cell / 2;
      // Four "fan" triangles spinning clockwise around the center.
      d += `M${x} ${y}L${x + m} ${y}L${x} ${y + m}Z`;
      d += `M${x + cell} ${y}L${x + cell} ${y + m}L${x + cell - m} ${y}Z`;
      d += `M${x + cell} ${y + cell}L${x + cell - m} ${y + cell}L${x + cell} ${y + cell - m}Z`;
      d += `M${x} ${y + cell}L${x} ${y + cell - m}L${x + m} ${y + cell}Z`;
    }
  }
  g.appendChild(svgEl('path', {d, fill: fg}));
  return g;
}

registerGenerator({name: 'pinwheel-tiles', category: 'geometric', weight: 2, render});
