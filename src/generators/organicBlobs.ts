/**
 * Organic blobs: a handful of smooth closed shapes built by perturbing a circle's
 * radius at evenly spaced angles and joining the points with Catmull-Rom-derived
 * cubic Beziers, so every blob is a soft, rounded, lava-like form.
 */
import {registerGenerator} from '../core/registry.js';
import {Color, DesignContext, Rect} from '../core/types.js';
import {baseFill, clipped, palettePair, svgEl} from './_generator.js';

/** Builds a smooth closed path through the given points using cubic Beziers. */
function smoothClosedPath(pts: Array<[number, number]>): string {
  const n = pts.length;
  let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    const p3 = pts[(i + 2) % n];
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += `C${c1x.toFixed(1)} ${c1y.toFixed(1)} ${c2x.toFixed(1)} ${c2y.toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d + 'z';
}

function render(ctx: DesignContext, bounds: Rect): SVGElement {
  const {rng, palette} = ctx;
  const {bg} = palettePair(ctx, rng);
  const g = clipped(ctx, bounds);
  baseFill(g, bounds, bg);

  const swatches: Color[] = [
    palette.primary,
    palette.accent,
    palette.colors[1] ?? palette.primary,
    palette.colors[4] ?? palette.accent,
  ];
  const minDim = Math.min(bounds.w, bounds.h);
  const count = rng.int(4, 10);

  for (let b = 0; b < count; b++) {
    const cx = bounds.x + rng.range(0.05, 0.95) * bounds.w;
    const cy = bounds.y + rng.range(0.05, 0.95) * bounds.h;
    const baseR = minDim * rng.range(0.1, 0.32);
    const wobble = rng.range(0.15, 0.4);
    const verts = rng.int(6, 11);
    const pts: Array<[number, number]> = [];
    for (let i = 0; i < verts; i++) {
      const ang = (i / verts) * Math.PI * 2;
      const r = baseR * (1 + rng.gaussian(0, wobble));
      pts.push([cx + Math.cos(ang) * r, cy + Math.sin(ang) * r]);
    }
    g.appendChild(
      svgEl('path', {
        d: smoothClosedPath(pts),
        fill: rng.pick(swatches),
        'fill-opacity': rng.range(0.7, 1).toFixed(2),
      }),
    );
  }
  return g;
}

registerGenerator({name: 'organic-blobs', category: 'organic', weight: 2, render});
