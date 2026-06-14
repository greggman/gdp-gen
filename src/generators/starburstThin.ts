/**
 * Thin starburst: many fine lines shooting from a single point to the edges,
 * evenly spaced in angle. A crisp, energetic radiant useful as a backdrop.
 */
import {registerGenerator} from '../core/registry.js';
import {DesignContext, Rect} from '../core/types.js';
import {baseFill, clipped, palettePair, svgEl} from './_generator.js';

function render(ctx: DesignContext, bounds: Rect): SVGElement {
  const {rng} = ctx;
  const {bg, fg} = palettePair(ctx, rng);
  const g = clipped(ctx, bounds);
  baseFill(g, bounds, bg);

  // Burst origin: usually center, sometimes offset for a dramatic angle.
  const cx = bounds.x + bounds.w * (rng.chance(0.6) ? 0.5 : rng.range(0.2, 0.8));
  const cy = bounds.y + bounds.h * (rng.chance(0.6) ? 0.5 : rng.range(0.2, 0.8));
  const maxR = Math.hypot(bounds.w, bounds.h);
  const lines = rng.int(40, 160);
  const phase = rng.range(0, Math.PI * 2);
  const jitter = rng.range(0, 0.4);

  let d = '';
  for (let i = 0; i < lines; i++) {
    const a = phase + (i / lines) * Math.PI * 2 + rng.range(-jitter, jitter) / lines;
    const x = (cx + Math.cos(a) * maxR).toFixed(2);
    const y = (cy + Math.sin(a) * maxR).toFixed(2);
    d += `M${cx.toFixed(2)} ${cy.toFixed(2)}L${x} ${y}`;
  }
  g.appendChild(
    svgEl('path', {
      d,
      stroke: fg,
      'stroke-width': (Math.min(bounds.w, bounds.h) * rng.range(0.002, 0.006)).toFixed(2),
      fill: 'none',
    }),
  );
  return g;
}

registerGenerator({name: 'starburst-thin', category: 'radial', weight: 2, render});
