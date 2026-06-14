/**
 * Concentric nested triangles: a stack of equilateral triangles shrinking
 * toward a shared centroid, alternating fill so the rings read as bold bands.
 */
import {registerGenerator} from '../core/registry.js';
import {DesignContext, Rect} from '../core/types.js';
import {baseFill, clipped, palettePair, svgEl} from './_generator.js';

function render(ctx: DesignContext, bounds: Rect): SVGElement {
  const {rng} = ctx;
  const {bg, fg} = palettePair(ctx, rng);
  const g = clipped(ctx, bounds);
  baseFill(g, bounds, bg);

  const cx = bounds.x + bounds.w / 2;
  const cy = bounds.y + bounds.h / 2;
  // Big enough to cover the rect even when rotated.
  const r0 = Math.hypot(bounds.w, bounds.h) * 0.75;
  const rot = (rng.int(0, 5) * 60 + (rng.chance() ? 30 : 0)) * (Math.PI / 180);
  const rings = rng.int(8, 16);

  const tri = (r: number): string => {
    let d = '';
    for (let k = 0; k < 3; k++) {
      const a = rot + (k * 2 * Math.PI) / 3 - Math.PI / 2;
      const px = (cx + Math.cos(a) * r).toFixed(1);
      const py = (cy + Math.sin(a) * r).toFixed(1);
      d += (k === 0 ? 'M' : 'L') + px + ' ' + py;
    }
    return d + 'z';
  };

  for (let i = 0; i < rings; i++) {
    const r = r0 * (1 - i / rings);
    if (r < 1) break;
    g.appendChild(svgEl('path', {d: tri(r), fill: i % 2 === 0 ? fg : bg}));
  }
  return g;
}

registerGenerator({name: 'nested-triangles', category: 'geometric', weight: 2, render});
