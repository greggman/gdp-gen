/**
 * Vintage radiating sunrays: alternating wedges fanning out from a point near
 * the bottom (or a corner), in the classic retro "rising sun" travel-poster
 * style. Every other wedge is filled, giving crisp pinwheel rays.
 */
import {registerGenerator} from '../core/registry.js';
import {DesignContext, Rect} from '../core/types.js';
import {baseFill, clipped, palettePair, svgEl} from './_generator.js';

function render(ctx: DesignContext, bounds: Rect): SVGElement {
  const {rng} = ctx;
  const {bg, fg} = palettePair(ctx, rng);
  const g = clipped(ctx, bounds);
  baseFill(g, bounds, bg);

  // Origin: a point biased toward an edge for a horizon-style burst.
  const cx = bounds.x + rng.range(0.3, 0.7) * bounds.w;
  const cy = bounds.y + rng.pick([0.0, 1.0, 0.5]) * bounds.h;
  const radius = Math.hypot(bounds.w, bounds.h) * 1.3;

  const rays = rng.int(14, 28) * 2; // even count so alternation closes cleanly.
  const step = (Math.PI * 2) / rays;
  const start = rng.range(0, step * 2);

  let d = '';
  for (let i = 0; i < rays; i += 2) {
    const a0 = start + i * step;
    const a1 = a0 + step;
    const x0 = cx + radius * Math.cos(a0);
    const y0 = cy + radius * Math.sin(a0);
    const x1 = cx + radius * Math.cos(a1);
    const y1 = cy + radius * Math.sin(a1);
    d +=
      `M${cx.toFixed(1)} ${cy.toFixed(1)}` +
      `L${x0.toFixed(1)} ${y0.toFixed(1)}` +
      `L${x1.toFixed(1)} ${y1.toFixed(1)}Z`;
  }
  g.appendChild(svgEl('path', {d, fill: fg}));
  return g;
}

registerGenerator({name: 'vintage-sunrays', category: 'retro', weight: 2, render});
