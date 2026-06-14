/**
 * Microdots: a dense field of very tiny dots on a fine lattice, reading as a
 * smooth flat tone up close and a subtle texture from afar.
 */
import {registerGenerator} from '../core/registry.js';
import {DesignContext, Rect} from '../core/types.js';
import {baseFill, clipped, palettePair, svgEl} from './_generator.js';

function render(ctx: DesignContext, bounds: Rect): SVGElement {
  const {rng} = ctx;
  const {bg, fg} = palettePair(ctx, rng);
  const g = clipped(ctx, bounds);
  baseFill(g, bounds, bg);

  // Fine lattice, but cap total nodes by clamping column count.
  const cols = Math.min(46, rng.int(30, 46));
  const step = bounds.w / cols;
  const rows = Math.min(48, Math.max(1, Math.round(bounds.h / step)));
  const radius = Math.max(0.6, step * rng.range(0.12, 0.22));
  const stagger = rng.chance(0.6);

  let d = '';
  for (let r = 0; r <= rows; r++) {
    const off = stagger && r % 2 === 1 ? step / 2 : 0;
    for (let c = 0; c <= cols; c++) {
      const cx = (bounds.x + off + c * step).toFixed(2);
      const cy = (bounds.y + r * step).toFixed(2);
      d += `M${cx} ${cy}m${-radius} 0a${radius} ${radius} 0 1 0 ${radius * 2} 0a${radius} ${radius} 0 1 0 ${-radius * 2} 0`;
    }
  }
  g.appendChild(svgEl('path', {d, fill: fg}));
  return g;
}

registerGenerator({name: 'microdots', category: 'dots', weight: 1, render});
