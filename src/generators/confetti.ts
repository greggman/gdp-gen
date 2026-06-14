/** Scattered confetti: small primitives strewn across the region (Memphis-y). */
import {registerGenerator} from '../core/registry.js';
import {Color, DesignContext, Rect} from '../core/types.js';
import {baseFill, clipped, palettePair, svgEl} from './_generator.js';

function render(ctx: DesignContext, bounds: Rect): SVGElement {
  const {rng, palette} = ctx;
  const {bg} = palettePair(ctx, rng);
  const g = clipped(ctx, bounds);
  baseFill(g, bounds, bg);

  const colors: Color[] = [palette.primary, palette.accent, palette.colors[3] ?? palette.primary];
  const area = bounds.w * bounds.h;
  const count = Math.min(450, Math.round(area / rng.range(700, 2000)));
  const base = Math.min(bounds.w, bounds.h);

  for (let i = 0; i < count; i++) {
    const x = bounds.x + rng.next() * bounds.w;
    const y = bounds.y + rng.next() * bounds.h;
    const s = base * rng.range(0.01, 0.05);
    const fill = rng.pick(colors);
    const shape = rng.pick(['circle', 'rect', 'line'] as const);
    if (shape === 'circle') {
      g.appendChild(svgEl('circle', {cx: x, cy: y, r: s / 2, fill}));
    } else if (shape === 'rect') {
      g.appendChild(
        svgEl('rect', {
          x,
          y,
          width: s,
          height: s,
          fill,
          transform: `rotate(${rng.int(0, 90)} ${x + s / 2} ${y + s / 2})`,
        }),
      );
    } else {
      const a = rng.range(0, Math.PI);
      g.appendChild(
        svgEl('line', {
          x1: x,
          y1: y,
          x2: x + Math.cos(a) * s * 2,
          y2: y + Math.sin(a) * s * 2,
          stroke: fill,
          'stroke-width': s * 0.4,
          'stroke-linecap': 'round',
        }),
      );
    }
  }
  return g;
}

registerGenerator({name: 'confetti', category: 'scatter', weight: 2, render});
