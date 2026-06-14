/** Concentric rings radiating from a point (often offset for tension). */
import {registerGenerator} from '../core/registry.js';
import {DesignContext, Rect} from '../core/types.js';
import {baseFill, clipped, palettePair, svgEl} from './_generator.js';

function render(ctx: DesignContext, bounds: Rect): SVGElement {
  const {rng} = ctx;
  const {bg, fg} = palettePair(ctx, rng);
  const g = clipped(ctx, bounds);
  baseFill(g, bounds, bg);

  const cx = bounds.x + bounds.w * rng.range(0.2, 0.8);
  const cy = bounds.y + bounds.h * rng.range(0.2, 0.8);
  const maxR = Math.hypot(bounds.w, bounds.h);
  const count = rng.int(6, 22);
  const step = maxR / count;
  const filled = rng.chance(0.5);

  for (let i = count; i >= 1; i--) {
    const r = i * step;
    if (filled) {
      g.appendChild(svgEl('circle', {cx, cy, r, fill: i % 2 === 0 ? fg : bg}));
    } else {
      g.appendChild(
        svgEl('circle', {
          cx,
          cy,
          r,
          fill: 'none',
          stroke: fg,
          'stroke-width': step * rng.range(0.15, 0.4),
        }),
      );
    }
  }
  return g;
}

registerGenerator({name: 'concentric-circles', category: 'geometric', weight: 2, render});
