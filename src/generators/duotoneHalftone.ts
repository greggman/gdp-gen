/**
 * Two-color halftone overlay: two halftone dot screens at different rotation
 * angles, one in the foreground color and one in the accent, offset like the
 * misregistered plates of a duotone print. The dot sizes vary across each grid
 * so the two layers create a moire-rich, two-ink tonal field.
 */
import {registerGenerator} from '../core/registry.js';
import {DesignContext, Rect} from '../core/types.js';
import {Color} from '../core/types.js';
import {baseFill, clipped, palettePair, svgEl} from './_generator.js';

function screen(
  bounds: Rect,
  angleDeg: number,
  cell: number,
  freq: number,
  phase: number,
): string {
  const cx = bounds.x + bounds.w / 2;
  const cy = bounds.y + bounds.h / 2;
  const diag = Math.hypot(bounds.w, bounds.h);
  const a = (angleDeg * Math.PI) / 180;
  const ca = Math.cos(a);
  const sa = Math.sin(a);
  const n = Math.ceil(diag / cell);
  const rMax = cell * 0.62;
  let d = '';
  for (let i = -n; i <= n; i++) {
    for (let j = -n; j <= n; j++) {
      const lx = i * cell;
      const ly = j * cell;
      const x = cx + lx * ca - ly * sa;
      const y = cy + lx * sa + ly * ca;
      const t = (Math.sin(lx * freq + phase) * Math.cos(ly * freq + phase) + 1) / 2;
      const r = rMax * (0.15 + 0.85 * t);
      if (r < 0.4) continue;
      d += `M${x.toFixed(1)} ${y.toFixed(1)}m${(-r).toFixed(1)} 0a${r.toFixed(1)} ${r.toFixed(1)} 0 1 0 ${(r * 2).toFixed(1)} 0a${r.toFixed(1)} ${r.toFixed(1)} 0 1 0 ${(-r * 2).toFixed(1)} 0`;
    }
  }
  return d;
}

function render(ctx: DesignContext, bounds: Rect): SVGElement {
  const {rng, palette} = ctx;
  const {bg, fg} = palettePair(ctx, rng);
  const second: Color = fg === palette.accent ? palette.primary : palette.accent;
  const g = clipped(ctx, bounds);
  baseFill(g, bounds, bg);

  const minDim = Math.min(bounds.w, bounds.h);
  const cell = minDim * rng.range(0.05, 0.085);
  const freq = rng.range(2, 5) / minDim;
  const phase = rng.range(0, Math.PI * 2);

  const d1 = screen(bounds, rng.pick([15, 0, 45]), cell, freq, phase);
  g.appendChild(svgEl('path', {d: d1, fill: fg, 'fill-opacity': '0.85'}));
  const d2 = screen(bounds, rng.pick([75, 45, 105]), cell, freq, phase + 1.3);
  g.appendChild(svgEl('path', {d: d2, fill: second, 'fill-opacity': '0.7'}));
  return g;
}

registerGenerator({name: 'duotone-halftone', category: 'halftone', weight: 2, render});
