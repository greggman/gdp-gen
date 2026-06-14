/**
 * Line-screen halftone: parallel lines whose thickness swells and shrinks across
 * the region, the classic engraver's line-screen used to render tone. The line
 * weight is modulated by a smooth low-frequency wave so light and dark bands
 * sweep across the field, all baked into a single filled path for density.
 */
import {registerGenerator} from '../core/registry.js';
import {DesignContext, Rect} from '../core/types.js';
import {baseFill, clipped, palettePair, svgEl} from './_generator.js';

function render(ctx: DesignContext, bounds: Rect): SVGElement {
  const {rng} = ctx;
  const {bg, fg} = palettePair(ctx, rng);
  const g = clipped(ctx, bounds);
  baseFill(g, bounds, bg);

  const angle = rng.pick([0, 90, 45, 135]);
  const cx = bounds.x + bounds.w / 2;
  const cy = bounds.y + bounds.h / 2;
  const diag = Math.hypot(bounds.w, bounds.h);
  const count = rng.int(28, 56);
  const step = diag / count;
  // Low-frequency modulation that drives the swelling of each line's width.
  const freq = (rng.range(1.5, 4) * Math.PI) / diag;
  const phase = rng.range(0, Math.PI * 2);
  const segs = 40;
  const x0 = cx - diag / 2;

  let d = '';
  for (let i = 0; i <= count; i++) {
    const yc = cy - diag / 2 + i * step;
    const halfWidths: number[] = [];
    for (let s = 0; s <= segs; s++) {
      const x = x0 + (diag * s) / segs;
      const t = (Math.sin(x * freq + i * 0.3 + phase) + 1) / 2;
      halfWidths.push((step * (0.08 + 0.42 * t)) / 2);
    }
    // Top edge left-to-right, then bottom edge right-to-left, closing the ribbon.
    for (let s = 0; s <= segs; s++) {
      const x = x0 + (diag * s) / segs;
      d += `${s === 0 ? 'M' : 'L'}${x.toFixed(1)} ${(yc - halfWidths[s]).toFixed(1)}`;
    }
    for (let s = segs; s >= 0; s--) {
      const x = x0 + (diag * s) / segs;
      d += `L${x.toFixed(1)} ${(yc + halfWidths[s]).toFixed(1)}`;
    }
    d += 'Z';
  }

  const rot = svgEl('g', {transform: `rotate(${angle} ${cx} ${cy})`});
  rot.appendChild(svgEl('path', {d, fill: fg}));
  g.appendChild(rot);
  return g;
}

registerGenerator({name: 'line-screen', category: 'halftone', weight: 2, render});
