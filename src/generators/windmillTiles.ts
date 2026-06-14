/**
 * Windmill block tiling: the classic quilt block where each square cell is split
 * into four rectangular "vanes" rotating around the center, alternating fg/bg so
 * adjacent vanes contrast and the grid reads as a field of spinning windmills.
 */
import {registerGenerator} from '../core/registry.js';
import {DesignContext, Rect} from '../core/types.js';
import {baseFill, clipped, palettePair, svgEl} from './_generator.js';

function render(ctx: DesignContext, bounds: Rect): SVGElement {
  const {rng} = ctx;
  const {bg, fg} = palettePair(ctx, rng);
  const g = clipped(ctx, bounds);
  baseFill(g, bounds, bg);

  const cols = rng.int(3, 6);
  const cell = bounds.w / cols;
  const rows = Math.ceil(bounds.h / cell) + 1;
  const m = cell / 2;

  // Each block = four right triangles forming pinwheel vanes; we draw only the
  // fg vanes (two opposite triangles) as one path; bg shows the rest.
  let d = '';
  for (let r = -1; r < rows; r++) {
    for (let c = -1; c <= cols; c++) {
      const x = bounds.x + c * cell;
      const y = bounds.y + r * cell;
      // Top-left vane: rectangle-ish triangle pointing toward center.
      d += `M${x} ${y}L${x + m} ${y}L${x + m} ${y + m}L${x} ${y + m}Z`;
      d += `M${x + m} ${y}L${x + cell} ${y}L${x + cell} ${y + m}Z`;
      // Bottom-right mirror so the two-fg, two-bg windmill reads.
      d += `M${x + cell} ${y + cell}L${x + m} ${y + cell}L${x + m} ${y + m}L${x + cell} ${y + m}Z`;
      d += `M${x + m} ${y + cell}L${x} ${y + cell}L${x} ${y + m}Z`;
    }
  }
  g.appendChild(svgEl('path', {d, fill: fg}));
  return g;
}

registerGenerator({name: 'windmill-tiles', category: 'geometric', weight: 2, render});
