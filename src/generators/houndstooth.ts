/**
 * Houndstooth: the classic broken-check textile motif built by tiling a single
 * jagged four-pointed tooth unit across the field. Every other cell is filled
 * with the foreground tooth so the negative space forms the interlocking shape.
 */
import {registerGenerator} from '../core/registry.js';
import {DesignContext, Rect} from '../core/types.js';
import {baseFill, clipped, palettePair, svgEl} from './_generator.js';

function render(ctx: DesignContext, bounds: Rect): SVGElement {
  const {rng} = ctx;
  const {bg, fg} = palettePair(ctx, rng);
  const g = clipped(ctx, bounds);
  baseFill(g, bounds, bg);

  const cols = rng.int(6, 12);
  const s = bounds.w / cols;
  const rows = Math.ceil(bounds.h / s) + 1;

  // One tooth occupies a 2x2 cell block; its barbs poke into neighbours.
  let d = '';
  for (let r = 0; r < rows; r += 2) {
    for (let c = -2; c < cols + 2; c += 2) {
      const x = bounds.x + c * s;
      const y = bounds.y + r * s;
      d += tooth(x, y, s);
    }
  }
  g.appendChild(svgEl('path', {d, fill: fg, 'fill-rule': 'nonzero'}));
  return g;
}

/** A single houndstooth tooth anchored at (x, y), cell size s. */
function tooth(x: number, y: number, s: number): string {
  const p = (a: number, b: number) => `${(x + a * s).toFixed(1)} ${(y + b * s).toFixed(1)}`;
  // Solid square body plus diagonal barbs top-right and bottom-left.
  return (
    `M${p(0, 0)}L${p(2, 0)}L${p(2, 1)}L${p(1, 1)}L${p(1, 2)}L${p(0, 2)}Z` +
    `M${p(2, 1)}L${p(3, 0)}L${p(3, 1)}L${p(2, 2)}Z` +
    `M${p(-1, 2)}L${p(0, 2)}L${p(1, 3)}L${p(0, 3)}Z`
  );
}

registerGenerator({name: 'houndstooth', category: 'retro', weight: 2, render});
