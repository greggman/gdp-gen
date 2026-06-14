/**
 * Copperplate engraving hatching: a primary set of fine parallel rules with a
 * second cross set laid over part of the field, the lines gently bowed as if
 * following a curved surface. Mimics the tonal hatching of old banknote and
 * map engravings. All strokes are emitted as two stroked paths.
 */
import {registerGenerator} from '../core/registry.js';
import {DesignContext, Rect} from '../core/types.js';
import {baseFill, clipped, palettePair, svgEl} from './_generator.js';

function hatchPath(
  bounds: Rect,
  angleDeg: number,
  count: number,
  bow: number,
  bowFreq: number,
): string {
  const cx = bounds.x + bounds.w / 2;
  const cy = bounds.y + bounds.h / 2;
  const diag = Math.hypot(bounds.w, bounds.h);
  const step = diag / count;
  const a = (angleDeg * Math.PI) / 180;
  const ca = Math.cos(a);
  const sa = Math.sin(a);
  // Perpendicular direction for the bow displacement.
  const px = -sa;
  const py = ca;
  const segs = 24;
  let d = '';
  for (let i = 0; i <= count; i++) {
    const off = -diag / 2 + i * step;
    let line = '';
    for (let s = 0; s <= segs; s++) {
      const along = -diag / 2 + (diag * s) / segs;
      const disp = bow * Math.sin((along / diag) * Math.PI * bowFreq + i * 0.2);
      const bx = cx + ca * along + px * (off + disp);
      const by = cy + sa * along + py * (off + disp);
      line += `${s === 0 ? 'M' : 'L'}${bx.toFixed(1)} ${by.toFixed(1)}`;
    }
    d += line;
  }
  return d;
}

function render(ctx: DesignContext, bounds: Rect): SVGElement {
  const {rng} = ctx;
  const {bg, fg} = palettePair(ctx, rng);
  const g = clipped(ctx, bounds);
  baseFill(g, bounds, bg);

  const minDim = Math.min(bounds.w, bounds.h);
  const base = rng.pick([0, 30, 45, 60, 90]);
  const count = rng.int(36, 64);
  const bow = minDim * rng.range(0.04, 0.12);
  const bowFreq = rng.range(1, 2.5);
  const sw = (Math.hypot(bounds.w, bounds.h) / count) * rng.range(0.18, 0.32);

  const d1 = hatchPath(bounds, base, count, bow, bowFreq);
  g.appendChild(
    svgEl('path', {d: d1, fill: 'none', stroke: fg, 'stroke-width': sw.toFixed(2)}),
  );
  // Cross set, sparser, to deepen tone where engravers want shadow.
  const d2 = hatchPath(bounds, base + 90, Math.round(count * 0.6), bow, bowFreq);
  g.appendChild(
    svgEl('path', {
      d: d2,
      fill: 'none',
      stroke: fg,
      'stroke-width': (sw * 0.85).toFixed(2),
      'stroke-opacity': '0.75',
    }),
  );
  return g;
}

registerGenerator({name: 'engraving-lines', category: 'line', weight: 2, render});
