/**
 * Radial lines: a dense burst of thin rays emanating from a single point,
 * spanning the whole region for a sunray/spoke op-art effect.
 */
import {registerGenerator} from '../core/registry.js';
import {DesignContext, Rect} from '../core/types.js';
import {baseFill, clipped, palettePair, svgEl} from './_generator.js';

function render(ctx: DesignContext, bounds: Rect): SVGElement {
  const {rng} = ctx;
  const {bg, fg} = palettePair(ctx, rng);
  const g = clipped(ctx, bounds);
  baseFill(g, bounds, bg);

  // Origin may sit off-region to throw the rays at a slant.
  const ox = bounds.x + bounds.w * rng.range(-0.1, 1.1);
  const oy = bounds.y + bounds.h * rng.range(-0.1, 1.1);
  const reach = Math.hypot(bounds.w, bounds.h) * 1.6;
  const count = Math.min(720, rng.int(80, 360));
  const stroke = Math.max(0.5, Math.min(bounds.w, bounds.h) * rng.range(0.002, 0.005));
  const start = rng.range(0, Math.PI * 2);
  const span = rng.pick([Math.PI * 2, Math.PI, Math.PI * 1.5]);
  const jitter = (span / count) * rng.range(0, 0.3);

  let d = '';
  for (let i = 0; i < count; i++) {
    const a = start + (span * i) / count + rng.range(-jitter, jitter);
    const ex = (ox + Math.cos(a) * reach).toFixed(1);
    const ey = (oy + Math.sin(a) * reach).toFixed(1);
    d += `M${ox.toFixed(1)} ${oy.toFixed(1)}L${ex} ${ey}`;
  }
  g.appendChild(
    svgEl('path', {d, stroke: fg, 'stroke-width': stroke.toFixed(2), fill: 'none'}),
  );
  return g;
}

registerGenerator({name: 'radial-lines', category: 'lines', weight: 2, render});
