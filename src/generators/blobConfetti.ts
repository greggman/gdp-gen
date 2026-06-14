/**
 * Blob confetti: a scatter of soft rounded blobs -- wobbly amoeba-like shapes
 * built from smooth cubic loops -- in mixed palette colors. Playful, organic
 * Memphis confetti.
 */
import {registerGenerator} from '../core/registry.js';
import {Color, DesignContext, Rect} from '../core/types.js';
import {baseFill, clipped, palettePair, svgEl} from './_generator.js';

/** Builds a closed smooth blob path around (cx,cy) with wobbly radii. */
function blobPath(
  cx: number,
  cy: number,
  r: number,
  lobes: number,
  wobble: number,
  rng: {range(min: number, max: number): number},
): string {
  const pts: Array<[number, number]> = [];
  for (let i = 0; i < lobes; i++) {
    const a = (i / lobes) * Math.PI * 2;
    const rr = r * (1 - wobble + rng.range(0, wobble * 2));
    pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]);
  }
  // Catmull-Rom-ish smooth close using quadratic midpoints.
  let d = '';
  for (let i = 0; i < lobes; i++) {
    const cur = pts[i];
    const next = pts[(i + 1) % lobes];
    const mx = (cur[0] + next[0]) / 2;
    const my = (cur[1] + next[1]) / 2;
    if (i === 0) d += `M ${mx.toFixed(1)} ${my.toFixed(1)}`;
    const after = pts[(i + 1) % lobes];
    const m2x = (after[0] + pts[(i + 2) % lobes][0]) / 2;
    const m2y = (after[1] + pts[(i + 2) % lobes][1]) / 2;
    d += ` Q ${after[0].toFixed(1)} ${after[1].toFixed(1)} ${m2x.toFixed(1)} ${m2y.toFixed(1)}`;
  }
  return d + ' Z';
}

function render(ctx: DesignContext, bounds: Rect): SVGElement {
  const {rng, palette} = ctx;
  const {bg} = palettePair(ctx, rng);
  const g = clipped(ctx, bounds);
  baseFill(g, bounds, bg);

  const inks: Color[] = [
    palette.primary,
    palette.accent,
    palette.colors[1] ?? palette.primary,
    palette.colors[2] ?? palette.accent,
    palette.colors[4] ?? palette.primary,
  ];
  const unit = Math.min(bounds.w, bounds.h);
  const area = bounds.w * bounds.h;
  const count = Math.min(400, Math.max(10, Math.round(area / (unit * unit * 0.03))));

  for (let i = 0; i < count; i++) {
    const cx = bounds.x + rng.next() * bounds.w;
    const cy = bounds.y + rng.next() * bounds.h;
    const r = unit * rng.range(0.025, 0.08);
    const lobes = rng.int(5, 8);
    const wobble = rng.range(0.12, 0.32);
    g.appendChild(
      svgEl('path', {d: blobPath(cx, cy, r, lobes, wobble, rng), fill: rng.pick(inks)}),
    );
  }
  return g;
}

registerGenerator({name: 'blob-confetti', category: 'memphis', weight: 2, render});
