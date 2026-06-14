/**
 * Polka dots: classic large evenly spaced dots on an offset (brick) grid,
 * the cheerful retro textile pattern.
 */
import {registerGenerator} from '../core/registry.js';
import {DesignContext, Rect} from '../core/types.js';
import {baseFill, clipped, palettePair, svgEl} from './_generator.js';

function render(ctx: DesignContext, bounds: Rect): SVGElement {
  const {rng} = ctx;
  const {bg, fg} = palettePair(ctx, rng);
  const g = clipped(ctx, bounds);
  baseFill(g, bounds, bg);

  const cols = rng.int(4, 9);
  const step = bounds.w / cols;
  const rows = Math.max(1, Math.round(bounds.h / step));
  const radius = step * rng.range(0.22, 0.36);
  const offset = step / 2;

  let d = '';
  for (let r = -1; r <= rows + 1; r++) {
    const shift = r % 2 === 0 ? 0 : offset;
    for (let c = -1; c <= cols + 1; c++) {
      const cx = (bounds.x + shift + c * step + offset).toFixed(1);
      const cy = (bounds.y + r * step + offset).toFixed(1);
      d += `M${cx} ${cy}m${-radius} 0a${radius} ${radius} 0 1 0 ${radius * 2} 0a${radius} ${radius} 0 1 0 ${-radius * 2} 0`;
    }
  }
  g.appendChild(svgEl('path', {d, fill: fg}));
  return g;
}

registerGenerator({name: 'polka-dots', category: 'dots', weight: 2, render});
