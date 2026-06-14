/** Fine speckled grain: many tiny marks for a printed/risograph texture. */
import {registerGenerator} from '../core/registry.js';
import {DesignContext, Rect} from '../core/types.js';
import {baseFill, clipped, palettePair, svgEl} from './_generator.js';

function render(ctx: DesignContext, bounds: Rect): SVGElement {
  const {rng} = ctx;
  const {bg, fg} = palettePair(ctx, rng);
  const g = clipped(ctx, bounds);
  baseFill(g, bounds, bg);

  const area = bounds.w * bounds.h;
  const count = Math.min(5000, Math.round(area / rng.range(40, 110)));
  const dot = Math.max(1.2, Math.min(bounds.w, bounds.h) * 0.008);
  // Group specks so the DOM stays light: one path of small rects.
  let d = '';
  for (let i = 0; i < count; i++) {
    const x = (bounds.x + rng.next() * bounds.w).toFixed(1);
    const y = (bounds.y + rng.next() * bounds.h).toFixed(1);
    d += `M${x} ${y}h${dot}v${dot}h${-dot}z`;
  }
  g.appendChild(svgEl('path', {d, fill: fg, 'fill-opacity': rng.range(0.5, 0.9).toFixed(2)}));
  return g;
}

registerGenerator({name: 'grain', category: 'noise', weight: 1, render});
