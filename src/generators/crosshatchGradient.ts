/**
 * Crosshatch density ramp: parallel hatch lines whose spacing tightens across
 * the region, then a second perpendicular set that only appears in the darker
 * half -- so tone deepens from open single-hatch through tight double-hatch,
 * the way a pen-and-ink artist builds shadow. Each set is one stroked path.
 */
import {registerGenerator} from '../core/registry.js';
import {DesignContext, Rect} from '../core/types.js';
import {baseFill, clipped, palettePair, svgEl} from './_generator.js';

/**
 * Builds a set of hatch lines at `angleDeg`. Line positions are warped toward
 * one end so spacing compresses, giving a density gradient along the axis.
 */
function rampHatch(
  bounds: Rect,
  angleDeg: number,
  lines: number,
  bias: number,
  startFrac: number,
): string {
  const cx = bounds.x + bounds.w / 2;
  const cy = bounds.y + bounds.h / 2;
  const diag = Math.hypot(bounds.w, bounds.h);
  const a = (angleDeg * Math.PI) / 180;
  const ca = Math.cos(a);
  const sa = Math.sin(a);
  const px = -sa;
  const py = ca;
  let d = '';
  for (let i = 0; i <= lines; i++) {
    const f = i / lines;
    if (f < startFrac) continue;
    // Warp f by a power so lines bunch toward f = 1.
    const warped = Math.pow(f, bias);
    const off = (warped - 0.5) * diag;
    const ax = cx + px * off - ca * diag;
    const ay = cy + py * off - sa * diag;
    const bx = cx + px * off + ca * diag;
    const by = cy + py * off + sa * diag;
    d += `M${ax.toFixed(1)} ${ay.toFixed(1)}L${bx.toFixed(1)} ${by.toFixed(1)}`;
  }
  return d;
}

function render(ctx: DesignContext, bounds: Rect): SVGElement {
  const {rng} = ctx;
  const {bg, fg} = palettePair(ctx, rng);
  const g = clipped(ctx, bounds);
  baseFill(g, bounds, bg);

  const base = rng.pick([0, 30, 45, 60]);
  const lines = rng.int(40, 70);
  const bias = rng.range(1.6, 2.6);
  const sw = Math.min(bounds.w, bounds.h) * rng.range(0.004, 0.008);

  const d1 = rampHatch(bounds, base, lines, bias, 0);
  g.appendChild(svgEl('path', {d: d1, fill: 'none', stroke: fg, 'stroke-width': sw.toFixed(2)}));
  // Second set only over the dense (darker) half for cross-hatching.
  const d2 = rampHatch(bounds, base + 90, lines, bias, 0.5);
  g.appendChild(svgEl('path', {d: d2, fill: 'none', stroke: fg, 'stroke-width': sw.toFixed(2)}));
  return g;
}

registerGenerator({name: 'crosshatch-gradient', category: 'line', weight: 2, render});
