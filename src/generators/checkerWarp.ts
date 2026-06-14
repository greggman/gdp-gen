/**
 * Checkerboard warped by a lens: a checker grid whose vertices are pushed by a
 * spherical lens at the center, so the squares bow outward like a magnifier.
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
  const radius = Math.min(bounds.w, bounds.h) * rng.range(0.35, 0.5);
  const strength = rng.range(0.4, 0.7);

  const warp = (x: number, y: number): [number, number] => {
    const dx = x - cx;
    const dy = y - cy;
    const d = Math.hypot(dx, dy);
    if (d >= radius || d < 0.001) return [x, y];
    const t = d / radius;
    // Magnifier: inner points pushed out most, blending to identity at edge.
    const f = 1 + strength * (1 - t * t);
    return [cx + dx * f, cy + dy * f];
  };

  const cols = rng.int(10, 16);
  const rows = Math.max(6, Math.round((cols * bounds.h) / bounds.w));
  const pad = 1;
  const cw = (bounds.w + 2 * pad) / cols;
  const ch = (bounds.h + 2 * pad) / rows;
  const px = (i: number): number => bounds.x - pad + i * cw;
  const py = (j: number): number => bounds.y - pad + j * ch;

  let d = '';
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      if (((i + j) & 1) === 0) continue;
      const [ax, ay] = warp(px(i), py(j));
      const [bx, by] = warp(px(i + 1), py(j));
      const [ex, ey] = warp(px(i + 1), py(j + 1));
      const [hx, hy] = warp(px(i), py(j + 1));
      d +=
        `M${ax.toFixed(1)} ${ay.toFixed(1)}` +
        `L${bx.toFixed(1)} ${by.toFixed(1)}` +
        `L${ex.toFixed(1)} ${ey.toFixed(1)}` +
        `L${hx.toFixed(1)} ${hy.toFixed(1)}z`;
    }
  }
  g.appendChild(svgEl('path', {d, fill: fg}));
  return g;
}

registerGenerator({name: 'checker-warp', category: 'geometric', weight: 2, render});
