/**
 * Glitch bars: horizontal slices of the region offset and recolored, like a
 * corrupted video frame or datamosh artifact.
 */
import {registerGenerator} from '../core/registry.js';
import {Color, DesignContext, Rect} from '../core/types.js';
import {baseFill, clipped, palettePair, svgEl} from './_generator.js';

function render(ctx: DesignContext, bounds: Rect): SVGElement {
  const {rng, palette} = ctx;
  const {bg, fg} = palettePair(ctx, rng);
  const g = clipped(ctx, bounds);
  baseFill(g, bounds, bg);

  const accents: Color[] = [fg, palette.accent, palette.primary, palette.colors[2] ?? fg];
  const slices = rng.int(14, 40);
  let y = bounds.y;
  for (let i = 0; i < slices && y < bounds.y + bounds.h; i++) {
    const h = (bounds.h / slices) * rng.range(0.5, 2.2);
    const off = rng.chance(0.55) ? bounds.w * rng.range(-0.25, 0.25) : 0;
    const w = bounds.w * rng.range(0.4, 1);
    const x = bounds.x + off + (off >= 0 ? 0 : 0);
    g.appendChild(
      svgEl('rect', {
        x: x.toFixed(1),
        y: y.toFixed(1),
        width: w.toFixed(1),
        height: (h + 1).toFixed(1),
        fill: rng.pick(accents),
        'fill-opacity': rng.range(0.55, 1).toFixed(2),
      }),
    );
    // Occasional thin RGB-split sliver.
    if (rng.chance(0.3)) {
      g.appendChild(
        svgEl('rect', {
          x: (bounds.x + bounds.w * rng.range(-0.1, 0.6)).toFixed(1),
          y: y.toFixed(1),
          width: (bounds.w * rng.range(0.2, 0.5)).toFixed(1),
          height: Math.max(1, h * 0.3).toFixed(1),
          fill: rng.pick(accents),
          'fill-opacity': '0.5',
        }),
      );
    }
    y += h;
  }
  return g;
}

registerGenerator({name: 'glitch-bars', category: 'techno', weight: 2, render});
