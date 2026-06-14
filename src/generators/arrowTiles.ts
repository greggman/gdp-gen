/**
 * Interlocking arrows: a brick-offset grid of chevron arrowheads that point in
 * one direction, packed so each arrow's notched tail receives the head of the
 * arrow behind it -- an interlocking tessellation reading as a march of arrows.
 */
import {registerGenerator} from '../core/registry.js';
import {DesignContext, Rect} from '../core/types.js';
import {baseFill, clipped, palettePair, svgEl} from './_generator.js';

function render(ctx: DesignContext, bounds: Rect): SVGElement {
  const {rng} = ctx;
  const {bg, fg} = palettePair(ctx, rng);
  const g = clipped(ctx, bounds);
  baseFill(g, bounds, bg);

  const cols = rng.int(3, 6);
  const w = bounds.w / cols;
  const h = w * 0.9;
  const rows = Math.ceil(bounds.h / h) + 2;
  const tip = w * 0.45; // How far the head juts out / the tail notches in.

  // Arrow profile pointing right, anchored at (x,y) top-left of its cell.
  // The notched tail (left side) cradles the previous arrow's pointed head.
  let d = '';
  for (let r = -1; r < rows; r++) {
    const offset = r % 2 === 0 ? 0 : w / 2;
    for (let c = -1; c <= cols; c++) {
      const x = bounds.x + c * w + offset;
      const y = bounds.y + r * h;
      const my = y + h / 2;
      d += `M${x} ${y}`;
      d += `L${x + w - tip} ${y}`;
      d += `L${x + w} ${my}`;
      d += `L${x + w - tip} ${y + h}`;
      d += `L${x} ${y + h}`;
      d += `L${x + tip} ${my}`;
      d += 'Z';
    }
  }
  g.appendChild(svgEl('path', {d, fill: fg}));
  return g;
}

registerGenerator({name: 'arrow-tiles', category: 'geometric', weight: 2, render});
