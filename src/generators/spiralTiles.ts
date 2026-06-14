/**
 * Spiral tiles: square tiles placed along a logarithmic spiral, each scaled and
 * rotated by its arm angle so they sweep from a tiny center out past the edges.
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
  const maxR = Math.hypot(bounds.w, bounds.h) * 0.6;
  const turns = rng.range(3, 5);
  const growth = rng.range(0.16, 0.24); // log-spiral tightness.
  const dir = rng.chance() ? 1 : -1;

  // Square footprint scales with radius so the spiral keeps coverage outward.
  let d = '';
  let theta = 0;
  let r = Math.min(bounds.w, bounds.h) * 0.02;
  const totalTheta = turns * 2 * Math.PI;
  let guard = 0;
  while (r < maxR && guard < 1400) {
    guard++;
    const x = cx + Math.cos(theta * dir) * r;
    const y = cy + Math.sin(theta * dir) * r;
    const size = Math.max(2, r * 0.5);
    const half = size / 2;
    const a = theta * dir + r * 0.01; // accumulate spin along the arm.
    const ca = Math.cos(a);
    const sa = Math.sin(a);
    const corner = (sx: number, sy: number): string =>
      `${(x + sx * ca - sy * sa).toFixed(1)} ${(y + sx * sa + sy * ca).toFixed(1)}`;
    d +=
      `M${corner(-half, -half)}` +
      `L${corner(half, -half)}` +
      `L${corner(half, half)}` +
      `L${corner(-half, half)}z`;
    // Advance so tiles overlap a little and keep the arm dense.
    const dTheta = Math.min(0.5, (size * 0.5) / (r + 1));
    theta += dTheta;
    r *= 1 + growth * dTheta;
    if (theta > totalTheta) r = maxR;
  }
  g.appendChild(svgEl('path', {d, fill: fg, stroke: bg, 'stroke-width': 1}));
  return g;
}

registerGenerator({name: 'spiral-tiles', category: 'geometric', weight: 2, render});
