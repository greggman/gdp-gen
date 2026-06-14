/**
 * Low-poly: a triangulated field. A jittered point grid is split into triangles
 * (two per cell, each cut along a random diagonal), and every triangle is shaded
 * by a smooth position-based gradient between the two palette colors. The result
 * is the faceted, crystalline look of low-poly art.
 */
import {registerGenerator} from '../core/registry.js';
import {DesignContext, Rect} from '../core/types.js';
import {clipped, palettePair, svgEl} from './_generator.js';

/** Linearly blends two #rrggbb colors; falls back to a if parsing fails. */
function mix(a: string, b: string, t: number): string {
  const pa = /^#([0-9a-f]{6})$/i.exec(a);
  const pb = /^#([0-9a-f]{6})$/i.exec(b);
  if (!pa || !pb) return a;
  const ai = parseInt(pa[1], 16);
  const bi = parseInt(pb[1], 16);
  const ch = (sh: number) => {
    const av = (ai >> sh) & 0xff;
    const bv = (bi >> sh) & 0xff;
    return Math.round(av + (bv - av) * t);
  };
  const to2 = (n: number) => n.toString(16).padStart(2, '0');
  return `#${to2(ch(16))}${to2(ch(8))}${to2(ch(0))}`;
}

function render(ctx: DesignContext, bounds: Rect): SVGElement {
  const {rng} = ctx;
  const {bg, fg} = palettePair(ctx, rng);
  const g = clipped(ctx, bounds);

  const aspect = bounds.w / bounds.h;
  const target = rng.int(7, 12);
  const rows = Math.max(4, Math.round(target / Math.sqrt(aspect)));
  const cols = Math.max(4, Math.round(target * Math.sqrt(aspect)));
  const cw = bounds.w / cols;
  const ch = bounds.h / rows;

  // Build a jittered grid of points (interior points wander, edges stay put).
  const px: number[][] = [];
  const py: number[][] = [];
  for (let r = 0; r <= rows; r++) {
    px[r] = [];
    py[r] = [];
    for (let c = 0; c <= cols; c++) {
      const edge = r === 0 || c === 0 || r === rows || c === cols;
      const jx = edge ? 0 : rng.range(-0.4, 0.4) * cw;
      const jy = edge ? 0 : rng.range(-0.4, 0.4) * ch;
      px[r][c] = bounds.x + c * cw + jx;
      py[r][c] = bounds.y + r * ch + jy;
    }
  }

  // Light direction for shading variety across the field.
  const ldx = rng.range(-1, 1);
  const ldy = rng.range(-1, 1);
  const tri = (
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    x3: number,
    y3: number,
  ) => {
    const cx = (x1 + x2 + x3) / 3;
    const cy = (y1 + y2 + y3) / 3;
    const u = (cx - bounds.x) / bounds.w;
    const v = (cy - bounds.y) / bounds.h;
    let t = (u * ldx + v * ldy + 1) / 2;
    t = Math.min(1, Math.max(0, t + rng.range(-0.08, 0.08)));
    g.appendChild(
      svgEl('polygon', {
        points: `${x1.toFixed(1)},${y1.toFixed(1)} ${x2.toFixed(1)},${y2.toFixed(1)} ${x3.toFixed(1)},${y3.toFixed(1)}`,
        fill: mix(bg, fg, t),
        stroke: mix(bg, fg, t),
        'stroke-width': 0.6,
      }),
    );
  };

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const tl = [px[r][c], py[r][c]];
      const tr = [px[r][c + 1], py[r][c + 1]];
      const bl = [px[r + 1][c], py[r + 1][c]];
      const brc = [px[r + 1][c + 1], py[r + 1][c + 1]];
      if (rng.chance()) {
        tri(tl[0], tl[1], tr[0], tr[1], brc[0], brc[1]);
        tri(tl[0], tl[1], brc[0], brc[1], bl[0], bl[1]);
      } else {
        tri(tl[0], tl[1], tr[0], tr[1], bl[0], bl[1]);
        tri(tr[0], tr[1], brc[0], brc[1], bl[0], bl[1]);
      }
    }
  }
  return g;
}

registerGenerator({name: 'low-poly', category: 'digital', weight: 2, render});
