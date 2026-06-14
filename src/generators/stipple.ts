/**
 * Stipple: randomly placed dots whose density varies smoothly across the
 * region, evoking pen-and-ink shading or a sprayed risograph tone.
 */
import {registerGenerator} from '../core/registry.js';
import {DesignContext, Rect} from '../core/types.js';
import {baseFill, clipped, palettePair, svgEl} from './_generator.js';

function render(ctx: DesignContext, bounds: Rect): SVGElement {
  const {rng} = ctx;
  const {bg, fg} = palettePair(ctx, rng);
  const g = clipped(ctx, bounds);
  baseFill(g, bounds, bg);

  const area = bounds.w * bounds.h;
  const attempts = Math.min(3000, Math.round(area / rng.range(60, 140)));
  const radius = Math.max(1, Math.min(bounds.w, bounds.h) * rng.range(0.004, 0.012));
  const angle = rng.range(0, Math.PI * 2);
  const ax = Math.cos(angle);
  const ay = Math.sin(angle);
  const flip = rng.chance(0.5) ? 1 : -1;

  let d = '';
  for (let i = 0; i < attempts; i++) {
    const x = rng.next();
    const y = rng.next();
    // Density gradient along a random axis; rejection sample to shape it.
    let p = (x * ax + y * ay) * 0.5 + 0.5;
    if (flip < 0) p = 1 - p;
    if (rng.next() > p * p) continue;
    const px = (bounds.x + x * bounds.w).toFixed(1);
    const py = (bounds.y + y * bounds.h).toFixed(1);
    d += `M${px} ${py}m${-radius} 0a${radius} ${radius} 0 1 0 ${radius * 2} 0a${radius} ${radius} 0 1 0 ${-radius * 2} 0`;
  }
  g.appendChild(svgEl('path', {d, fill: fg}));
  return g;
}

registerGenerator({name: 'stipple', category: 'dots', weight: 2, render});
