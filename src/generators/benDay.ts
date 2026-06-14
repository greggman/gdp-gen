/**
 * Ben-Day dots: an even grid of uniform solid dots in the manner of vintage
 * comic-book color fields. Dot size and spacing are fixed across the field
 * for that mechanical, pre-press halftone feel.
 */
import {registerGenerator} from '../core/registry.js';
import {DesignContext, Rect} from '../core/types.js';
import {baseFill, clipped, palettePair, svgEl} from './_generator.js';

function render(ctx: DesignContext, bounds: Rect): SVGElement {
  const {rng} = ctx;
  const {bg, fg} = palettePair(ctx, rng);
  const g = clipped(ctx, bounds);
  baseFill(g, bounds, bg);

  const minDim = Math.min(bounds.w, bounds.h);
  const cols = rng.int(14, 28);
  const step = bounds.w / cols;
  const rows = Math.ceil(bounds.h / step) + 1;
  const radius = step * rng.range(0.28, 0.42);
  const stagger = rng.chance(0.5);

  let d = '';
  for (let r = 0; r < rows; r++) {
    const offset = stagger && r % 2 === 1 ? step / 2 : 0;
    for (let c = -1; c <= cols; c++) {
      const cx = bounds.x + offset + (c + 0.5) * step;
      const cy = bounds.y + (r + 0.5) * step;
      // Circle drawn as two arcs so all dots share one path node.
      d += `M${(cx - radius).toFixed(1)} ${cy.toFixed(1)}` +
        `a${radius.toFixed(1)} ${radius.toFixed(1)} 0 1 0 ${(radius * 2).toFixed(1)} 0` +
        `a${radius.toFixed(1)} ${radius.toFixed(1)} 0 1 0 ${(-radius * 2).toFixed(1)} 0z`;
    }
  }
  void minDim;
  g.appendChild(svgEl('path', {d, fill: fg}));
  return g;
}

registerGenerator({name: 'ben-day', category: 'print', weight: 2, render});
