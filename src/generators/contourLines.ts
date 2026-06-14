/**
 * Contour lines: topographic-map loops. A few smooth radial "hills" are summed
 * into a height field, and several iso-level rings are traced as closed loops.
 */
import {registerGenerator} from '../core/registry.js';
import {DesignContext, Rect} from '../core/types.js';
import {baseFill, clipped, palettePair, svgEl} from './_generator.js';

interface Hill {
  x: number;
  y: number;
  r: number;
  s: number;
}

function render(ctx: DesignContext, bounds: Rect): SVGElement {
  const {rng} = ctx;
  const {bg, fg} = palettePair(ctx, rng);
  const g = clipped(ctx, bounds);
  baseFill(g, bounds, bg);

  const hills: Hill[] = [];
  const hillCount = rng.int(3, 6);
  const diag = Math.hypot(bounds.w, bounds.h);
  for (let i = 0; i < hillCount; i++) {
    hills.push({
      x: bounds.x + rng.range(0.05, 0.95) * bounds.w,
      y: bounds.y + rng.range(0.05, 0.95) * bounds.h,
      r: diag * rng.range(0.18, 0.45),
      s: rng.range(0.5, 1) * (rng.chance(0.85) ? 1 : -1),
    });
  }

  const field = (px: number, py: number): number => {
    let v = 0;
    for (const h of hills) {
      const d2 = (px - h.x) ** 2 + (py - h.y) ** 2;
      v += h.s * Math.exp(-d2 / (2 * h.r * h.r));
    }
    return v;
  };

  // Marching-squares over a grid, emitting per-cell segments per level.
  const gx = Math.min(120, Math.max(40, Math.round(bounds.w / 10)));
  const gy = Math.min(120, Math.max(40, Math.round(bounds.h / 10)));
  const cw = bounds.w / gx;
  const ch = bounds.h / gy;
  const vals: number[] = new Array((gx + 1) * (gy + 1));
  let lo = Infinity;
  let hi = -Infinity;
  for (let j = 0; j <= gy; j++) {
    for (let i = 0; i <= gx; i++) {
      const v = field(bounds.x + i * cw, bounds.y + j * ch);
      vals[j * (gx + 1) + i] = v;
      if (v < lo) lo = v;
      if (v > hi) hi = v;
    }
  }

  const levels = rng.int(7, 14);
  const stroke = Math.max(0.7, Math.min(bounds.w, bounds.h) * rng.range(0.0025, 0.006));
  const lerp = (a: number, b: number, va: number, vb: number, t: number): number =>
    a + ((t - va) / (vb - va)) * (b - a);

  let d = '';
  for (let k = 1; k <= levels; k++) {
    const t = lo + ((hi - lo) * k) / (levels + 1);
    for (let j = 0; j < gy; j++) {
      for (let i = 0; i < gx; i++) {
        const x0 = bounds.x + i * cw;
        const y0 = bounds.y + j * ch;
        const x1 = x0 + cw;
        const y1 = y0 + ch;
        const tl = vals[j * (gx + 1) + i];
        const tr = vals[j * (gx + 1) + i + 1];
        const br = vals[(j + 1) * (gx + 1) + i + 1];
        const bl = vals[(j + 1) * (gx + 1) + i];
        let idx = 0;
        if (tl > t) idx |= 8;
        if (tr > t) idx |= 4;
        if (br > t) idx |= 2;
        if (bl > t) idx |= 1;
        if (idx === 0 || idx === 15) continue;
        const top = {x: lerp(x0, x1, tl, tr, t), y: y0};
        const right = {x: x1, y: lerp(y0, y1, tr, br, t)};
        const bottom = {x: lerp(x0, x1, bl, br, t), y: y1};
        const left = {x: x0, y: lerp(y0, y1, tl, bl, t)};
        const seg = (a: {x: number; y: number}, b: {x: number; y: number}): void => {
          d += `M${a.x.toFixed(1)} ${a.y.toFixed(1)}L${b.x.toFixed(1)} ${b.y.toFixed(1)}`;
        };
        switch (idx) {
          case 1:
          case 14:
            seg(left, bottom);
            break;
          case 2:
          case 13:
            seg(bottom, right);
            break;
          case 3:
          case 12:
            seg(left, right);
            break;
          case 4:
          case 11:
            seg(top, right);
            break;
          case 6:
          case 9:
            seg(top, bottom);
            break;
          case 7:
          case 8:
            seg(top, left);
            break;
          case 5:
            seg(top, left);
            seg(bottom, right);
            break;
          case 10:
            seg(top, right);
            seg(left, bottom);
            break;
        }
      }
    }
  }
  g.appendChild(
    svgEl('path', {d, stroke: fg, 'stroke-width': stroke.toFixed(2), fill: 'none'}),
  );
  return g;
}

registerGenerator({name: 'contour-lines', category: 'lines', weight: 2, render});
