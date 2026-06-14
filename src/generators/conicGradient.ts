/**
 * Conic gradient: a sweep of color around a center built from many thin wedge
 * triangles. The wedges step through a looping ramp of palette colors so the
 * full ring reads as a continuous angular sweep without any RGB math.
 */
import {registerGenerator} from '../core/registry.js';
import {Color, DesignContext, Rect} from '../core/types.js';
import {baseFill, clipped, palettePair, svgEl} from './_generator.js';

function render(ctx: DesignContext, bounds: Rect): SVGElement {
  const {rng, palette} = ctx;
  const {bg, fg} = palettePair(ctx, rng);
  const g = clipped(ctx, bounds);
  baseFill(g, bounds, bg);

  const cx = bounds.x + bounds.w * rng.range(0.4, 0.6);
  const cy = bounds.y + bounds.h * rng.range(0.4, 0.6);
  const reach = Math.hypot(bounds.w, bounds.h);
  const segments = rng.int(48, 120);
  const start = rng.range(0, Math.PI * 2);

  // A palindromic ramp so the sweep closes smoothly back to its start color.
  const ramp: Color[] = [fg, palette.accent, palette.primary, bg, palette.primary, palette.accent];

  for (let i = 0; i < segments; i++) {
    const a0 = start + (i / segments) * Math.PI * 2;
    const a1 = start + ((i + 1.02) / segments) * Math.PI * 2;
    const col = ramp[Math.floor((i / segments) * ramp.length) % ramp.length];
    const x0 = cx + Math.cos(a0) * reach;
    const y0 = cy + Math.sin(a0) * reach;
    const x1 = cx + Math.cos(a1) * reach;
    const y1 = cy + Math.sin(a1) * reach;
    g.appendChild(
      svgEl('polygon', {
        points: `${cx.toFixed(1)},${cy.toFixed(1)} ${x0.toFixed(1)},${y0.toFixed(1)} ${x1.toFixed(1)},${y1.toFixed(1)}`,
        fill: col,
      }),
    );
  }
  return g;
}

registerGenerator({name: 'conic-gradient', category: 'gradient', weight: 2, render});
