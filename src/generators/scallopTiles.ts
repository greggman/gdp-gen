/**
 * Scalloped fan tiling: overlapping rows of half-circle "fish scale" arcs that
 * are filled as solid fans, each row offset by half a step and stacked so the
 * curved tops cover the seams of the row below -- a bold scallop field.
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
  const r = bounds.w / cols / 2;
  const rowStep = r; // Rows overlap heavily so scallops nest.
  const rows = Math.ceil(bounds.h / rowStep) + 2;

  // Build solid scallop fans as a single path; draw top rows last so they
  // overlap the seams of the rows above them.
  let d = '';
  for (let row = -1; row < rows; row++) {
    const cy = bounds.y + row * rowStep;
    const offset = row % 2 === 0 ? 0 : r;
    for (let col = -1; col <= cols; col++) {
      const cx = bounds.x + col * 2 * r + offset + r;
      // Half-disc fan: arc from left to right across the top, base flat below.
      d += `M${cx - r} ${cy}A${r} ${r} 0 0 1 ${cx + r} ${cy}L${cx + r} ${cy + r}L${cx - r} ${cy + r}Z`;
    }
  }
  g.appendChild(svgEl('path', {d, fill: fg}));
  return g;
}

registerGenerator({name: 'scallop-tiles', category: 'geometric', weight: 2, render});
