/**
 * Pinwheel: a ring of triangular blades radiating from the center, each filled
 * from a small palette set and given a slight twist so they read as spinning.
 */
import {registerGenerator} from '../core/registry.js';
import {Color, DesignContext, Rect} from '../core/types.js';
import {baseFill, clipped, palettePair, svgEl} from './_generator.js';

function render(ctx: DesignContext, bounds: Rect): SVGElement {
  const {rng, palette} = ctx;
  const {bg} = palettePair(ctx, rng);
  const g = clipped(ctx, bounds);
  baseFill(g, bounds, bg);

  const cx = bounds.x + bounds.w / 2;
  const cy = bounds.y + bounds.h / 2;
  const maxR = Math.hypot(bounds.w, bounds.h) / 2;
  const blades = rng.int(6, 16);
  const colors: Color[] = rng.sample(
    [palette.primary, palette.accent, ...palette.colors],
    rng.int(2, 3),
  );
  const step = (Math.PI * 2) / blades;
  const twist = step * rng.range(0.4, 0.95);
  const start = rng.range(0, Math.PI * 2);

  for (let i = 0; i < blades; i++) {
    const a0 = start + i * step;
    const a1 = a0 + twist;
    const x0 = (cx + Math.cos(a0) * maxR).toFixed(2);
    const y0 = (cy + Math.sin(a0) * maxR).toFixed(2);
    const x1 = (cx + Math.cos(a1) * maxR).toFixed(2);
    const y1 = (cy + Math.sin(a1) * maxR).toFixed(2);
    g.appendChild(
      svgEl('path', {
        d: `M${cx.toFixed(2)} ${cy.toFixed(2)}L${x0} ${y0}L${x1} ${y1}Z`,
        fill: colors[i % colors.length],
      }),
    );
  }
  return g;
}

registerGenerator({name: 'pinwheel', category: 'radial', weight: 2, render});
