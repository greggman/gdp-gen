/**
 * Concentric water ripples: one or two drop centers emit expanding rings whose
 * stroke width fades with radius, like waves spreading on a pond. Where two ring
 * sets overlap they interfere, giving a calm rippled-surface pattern that fills
 * the whole region.
 */
import {registerGenerator} from '../core/registry.js';
import {DesignContext, Rect} from '../core/types.js';
import {baseFill, clipped, palettePair, svgEl} from './_generator.js';

function render(ctx: DesignContext, bounds: Rect): SVGElement {
  const {rng, palette} = ctx;
  const {bg, fg} = palettePair(ctx, rng);
  const accent = palette.accent === fg ? palette.primary : palette.accent;
  const g = clipped(ctx, bounds);
  baseFill(g, bounds, bg);

  const diag = Math.hypot(bounds.w, bounds.h);
  const drops = rng.int(1, 2);
  const colors = [fg, accent];
  for (let dpi = 0; dpi < drops; dpi++) {
    const cx = bounds.x + rng.range(0.15, 0.85) * bounds.w;
    const cy = bounds.y + rng.range(0.15, 0.85) * bounds.h;
    const maxR = diag * 1.1;
    const spacing = maxR / rng.int(16, 26);
    const color = colors[dpi % colors.length];
    let i = 0;
    for (let r = spacing; r < maxR; r += spacing) {
      // Width swells then thins as the ripple travels outward.
      const t = r / maxR;
      const w = (1 + 4 * Math.exp(-t * 2.2)) * (0.6 + 0.4 * Math.sin(i * 0.9));
      g.appendChild(svgEl('circle', {
        cx, cy, r: r.toFixed(1),
        fill: 'none',
        stroke: color,
        'stroke-width': Math.max(0.6, w).toFixed(2),
        'stroke-opacity': (0.9 - t * 0.45).toFixed(2),
      }));
      i++;
    }
  }
  return g;
}

registerGenerator({name: 'water-ripple', category: 'organic', weight: 2, render});
