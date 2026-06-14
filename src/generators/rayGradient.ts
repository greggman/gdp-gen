/**
 * Ray gradient: wedges radiating from the center, each filled with a thin
 * triangle whose opacity fades from solid at the hub to transparent at the rim,
 * giving a soft sunray glow.
 */
import {registerGenerator} from '../core/registry.js';
import {DesignContext, Rect} from '../core/types.js';
import {baseFill, clipped, palettePair, svgEl} from './_generator.js';

function render(ctx: DesignContext, bounds: Rect): SVGElement {
  const {rng} = ctx;
  const {bg, fg} = palettePair(ctx, rng);
  const g = clipped(ctx, bounds);
  baseFill(g, bounds, bg);

  const cx = bounds.x + bounds.w / 2;
  const cy = bounds.y + bounds.h / 2;
  const maxR = Math.hypot(bounds.w, bounds.h) / 2;
  // Rays approximate a fade by stacking concentric translucent rings of
  // alternating wedges; each band fades a step toward transparent.
  const rays = rng.int(12, 40);
  const bands = rng.int(4, 8);
  const phase = rng.range(0, Math.PI * 2);
  const step = (Math.PI * 2) / rays;
  const fade = rng.chance(0.7);

  for (let b = 0; b < bands; b++) {
    const r0 = (b / bands) * maxR;
    const r1 = ((b + 1) / bands) * maxR;
    const t = b / (bands - 1 || 1);
    const opacity = fade ? (1 - t) * 0.9 + 0.05 : t * 0.9 + 0.05;
    let d = '';
    for (let i = 0; i < rays; i += 2) {
      const a0 = phase + i * step;
      const a1 = a0 + step;
      const x0o = (cx + Math.cos(a0) * r1).toFixed(2);
      const y0o = (cy + Math.sin(a0) * r1).toFixed(2);
      const x1o = (cx + Math.cos(a1) * r1).toFixed(2);
      const y1o = (cy + Math.sin(a1) * r1).toFixed(2);
      const x1i = (cx + Math.cos(a1) * r0).toFixed(2);
      const y1i = (cy + Math.sin(a1) * r0).toFixed(2);
      const x0i = (cx + Math.cos(a0) * r0).toFixed(2);
      const y0i = (cy + Math.sin(a0) * r0).toFixed(2);
      d += `M${x0i} ${y0i}L${x0o} ${y0o}L${x1o} ${y1o}L${x1i} ${y1i}Z`;
    }
    g.appendChild(svgEl('path', {d, fill: fg, 'fill-opacity': opacity.toFixed(2)}));
  }
  return g;
}

registerGenerator({name: 'ray-gradient', category: 'radial', weight: 2, render});
