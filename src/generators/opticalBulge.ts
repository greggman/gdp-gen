/**
 * Optical bulge: a regular line grid displaced radially so the center appears
 * to swell toward the viewer, like a fisheye lens over graph paper.
 */
import {registerGenerator} from '../core/registry.js';
import {DesignContext, Rect} from '../core/types.js';
import {baseFill, clipped, palettePair, svgEl} from './_generator.js';

function render(ctx: DesignContext, bounds: Rect): SVGElement {
  const {rng} = ctx;
  const {bg, fg} = palettePair(ctx, rng);
  const g = clipped(ctx, bounds);
  baseFill(g, bounds, bg);

  const cx = bounds.x + bounds.w / 2 + rng.range(-0.15, 0.15) * bounds.w;
  const cy = bounds.y + bounds.h / 2 + rng.range(-0.15, 0.15) * bounds.h;
  const radius = Math.hypot(bounds.w, bounds.h) * rng.range(0.45, 0.65);
  const strength = rng.range(0.35, 0.6); // outward push at the peak.

  // Warp pushes points away from center inside `radius`, peaking at the middle.
  const warp = (x: number, y: number): [number, number] => {
    const dx = x - cx;
    const dy = y - cy;
    const d = Math.hypot(dx, dy);
    if (d >= radius || d < 0.001) return [x, y];
    const t = d / radius;
    // Smooth falloff: max displacement at mid-radius, zero at center and edge.
    const f = 1 + strength * Math.sin(t * Math.PI) * (1 - t * 0.5);
    return [cx + dx * f, cy + dy * f];
  };

  const cols = rng.int(14, 22);
  const rows = Math.max(8, Math.round((cols * bounds.h) / bounds.w));
  const sw = (Math.min(bounds.w, bounds.h) / cols) * 0.12;
  const pad = bounds.w / cols; // sample slightly beyond edges to avoid gaps.
  const x0 = bounds.x - pad;
  const y0 = bounds.y - pad;
  const gw = bounds.w + 2 * pad;
  const gh = bounds.h + 2 * pad;
  const seg = 7; // subdivisions per line for smooth curves.

  let d = '';
  for (let i = 0; i <= cols; i++) {
    const x = x0 + (i / cols) * gw;
    for (let j = 0; j <= rows; j++) {
      const y = y0 + (j / rows) * gh;
      const [px, py] = warp(x, y);
      d += (j === 0 ? 'M' : 'L') + px.toFixed(1) + ' ' + py.toFixed(1);
      void seg;
    }
  }
  for (let j = 0; j <= rows; j++) {
    const y = y0 + (j / rows) * gh;
    for (let i = 0; i <= cols; i++) {
      const x = x0 + (i / cols) * gw;
      const [px, py] = warp(x, y);
      d += (i === 0 ? 'M' : 'L') + px.toFixed(1) + ' ' + py.toFixed(1);
    }
  }
  g.appendChild(
    svgEl('path', {d, fill: 'none', stroke: fg, 'stroke-width': sw, 'stroke-linecap': 'round'}),
  );
  return g;
}

registerGenerator({name: 'optical-bulge', category: 'geometric', weight: 2, render});
