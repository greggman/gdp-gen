/**
 * Diamond grid: a lattice of outlined diamonds (rotated squares) tiled edge to
 * edge across the region, drawn as a single stroked path for a crisp trellis.
 */
import {registerGenerator} from '../core/registry.js';
import {DesignContext, Rect} from '../core/types.js';
import {baseFill, clipped, palettePair, svgEl} from './_generator.js';

function render(ctx: DesignContext, bounds: Rect): SVGElement {
  const {rng} = ctx;
  const {bg, fg} = palettePair(ctx, rng);
  const g = clipped(ctx, bounds);
  baseFill(g, bounds, bg);

  const cols = rng.int(5, 10);
  const dw = bounds.w / cols; // diamond full width.
  const dh = dw * rng.range(0.8, 1.4); // full height (can be a tall lozenge).
  const hw = dw / 2;
  const hh = dh / 2;
  const sw = Math.max(1.5, dw * rng.range(0.06, 0.1));
  const filled = rng.chance(0.4);

  // Diamonds centered on a half-offset lattice so they nest edge to edge.
  const rows = Math.ceil(bounds.h / hh) + 2;
  let d = '';
  for (let j = -1; j < rows; j++) {
    const cyc = bounds.y + j * hh;
    const offset = (j & 1) === 1 ? hw : 0;
    for (let i = -1; i * dw + offset < bounds.w + dw; i++) {
      const cxc = bounds.x + i * dw + offset;
      d +=
        `M${cxc.toFixed(1)} ${(cyc - hh).toFixed(1)}` +
        `L${(cxc + hw).toFixed(1)} ${cyc.toFixed(1)}` +
        `L${cxc.toFixed(1)} ${(cyc + hh).toFixed(1)}` +
        `L${(cxc - hw).toFixed(1)} ${cyc.toFixed(1)}z`;
    }
  }
  g.appendChild(
    svgEl('path', {
      d,
      fill: filled ? fg : 'none',
      stroke: fg,
      'stroke-width': sw,
      'stroke-linejoin': 'round',
    }),
  );
  return g;
}

registerGenerator({name: 'diamond-grid', category: 'geometric', weight: 2, render});
