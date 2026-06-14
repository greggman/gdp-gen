/**
 * Terrazzo: a dense scatter of irregular polygonal chips over a pale ground,
 * mimicking polished terrazzo flooring. Chips vary in size and color and are
 * batched into per-color paths to keep the DOM light.
 */
import {registerGenerator} from '../core/registry.js';
import {Color, DesignContext, Rect} from '../core/types.js';
import {baseFill, clipped, palettePair, svgEl} from './_generator.js';

function render(ctx: DesignContext, bounds: Rect): SVGElement {
  const {rng, palette} = ctx;
  const {bg} = palettePair(ctx, rng);
  const g = clipped(ctx, bounds);
  baseFill(g, bounds, bg);

  const inks: Color[] = [
    palette.primary,
    palette.accent,
    palette.colors[1] ?? palette.primary,
    palette.colors[3] ?? palette.accent,
  ];
  const area = bounds.w * bounds.h;
  const unit = Math.min(bounds.w, bounds.h);
  const count = Math.min(900, Math.max(40, Math.round(area / (unit * unit * 0.012))));
  const paths: Record<number, string> = {};

  for (let i = 0; i < count; i++) {
    const cx = bounds.x + rng.next() * bounds.w;
    const cy = bounds.y + rng.next() * bounds.h;
    const r = unit * rng.range(0.01, 0.035);
    const sides = rng.int(3, 6);
    const ci = rng.int(0, inks.length - 1);
    let d = '';
    const start = rng.next() * Math.PI * 2;
    for (let s = 0; s < sides; s++) {
      const a = start + (s / sides) * Math.PI * 2;
      const rr = r * rng.range(0.6, 1.1);
      const px = (cx + Math.cos(a) * rr).toFixed(1);
      const py = (cy + Math.sin(a) * rr).toFixed(1);
      d += (s === 0 ? 'M' : 'L') + px + ' ' + py;
    }
    d += 'Z';
    paths[ci] = (paths[ci] ?? '') + d;
  }
  for (const key of Object.keys(paths)) {
    g.appendChild(svgEl('path', {d: paths[Number(key)], fill: inks[Number(key)]}));
  }
  return g;
}

registerGenerator({name: 'terrazzo', category: 'memphis', weight: 2, render});
