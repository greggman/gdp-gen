/**
 * Dot grid: an even lattice of equal-size dots across the region. The classic
 * regular halftone field -- restful, rhythmic, and faintly technical.
 */
import {registerGenerator} from '../core/registry.js';
import {DesignContext, Rect} from '../core/types.js';
import {baseFill, clipped, palettePair, svgEl} from './_generator.js';

function render(ctx: DesignContext, bounds: Rect): SVGElement {
  const {rng} = ctx;
  const {bg, fg} = palettePair(ctx, rng);
  const g = clipped(ctx, bounds);
  baseFill(g, bounds, bg);

  const cols = rng.int(8, 22);
  const step = bounds.w / cols;
  const rows = Math.max(1, Math.round(bounds.h / step));
  const radius = step * rng.range(0.18, 0.42);
  const stagger = rng.chance(0.4);

  let d = '';
  for (let r = 0; r <= rows; r++) {
    const offset = stagger && r % 2 === 1 ? step / 2 : 0;
    for (let c = 0; c <= cols; c++) {
      const cx = (bounds.x + offset + c * step).toFixed(1);
      const cy = (bounds.y + r * step).toFixed(1);
      d += `M${cx} ${cy}m${-radius} 0a${radius} ${radius} 0 1 0 ${radius * 2} 0a${radius} ${radius} 0 1 0 ${-radius * 2} 0`;
    }
  }
  g.appendChild(svgEl('path', {d, fill: fg}));
  return g;
}

registerGenerator({name: 'dot-grid', category: 'dots', weight: 2, render});
