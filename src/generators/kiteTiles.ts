/**
 * Kite/dart tiling: a grid of square cells each split into a four kite-shaped
 * quadrilaterals meeting at the center, the classic "kite" quilt unit. Alternate
 * kites take fg/accent so the field reads as rows of tilted diamonds with dart
 * gaps between them.
 */
import {registerGenerator} from '../core/registry.js';
import {DesignContext, Rect} from '../core/types.js';
import {baseFill, clipped, palettePair, svgEl} from './_generator.js';

function render(ctx: DesignContext, bounds: Rect): SVGElement {
  const {rng, palette} = ctx;
  const {bg, fg} = palettePair(ctx, rng);
  const dart = fg === palette.accent ? palette.primary : palette.accent;
  const g = clipped(ctx, bounds);
  baseFill(g, bounds, bg);

  const cols = rng.int(3, 6);
  const cell = bounds.w / cols;
  const rows = Math.ceil(bounds.h / cell) + 1;
  const k = cell * 0.32; // Offset that gives the kite its asymmetric belly.

  // Per cell: a central kite (fg) plus four corner darts (accent) wedged between
  // the kite and the cell corners.
  let kiteD = '';
  let dartD = '';
  for (let r = -1; r < rows; r++) {
    for (let c = -1; c <= cols; c++) {
      const x = bounds.x + c * cell;
      const y = bounds.y + r * cell;
      const cx = x + cell / 2;
      const cy = y + cell / 2;
      // Kite: top apex at edge midpoint, fat belly below center, side points.
      const top = `${cx} ${y + cell * 0.05}`;
      const right = `${x + cell - k} ${cy}`;
      const bot = `${cx} ${y + cell - cell * 0.05}`;
      const left = `${x + k} ${cy}`;
      kiteD += `M${top}L${right}L${bot}L${left}Z`;
      // Four darts in the corners (triangles from corner to two side points).
      dartD += `M${x} ${y}L${cx} ${y + cell * 0.05}L${x + k} ${cy}Z`;
      dartD += `M${x + cell} ${y}L${x + cell - k} ${cy}L${cx} ${y + cell * 0.05}Z`;
      dartD += `M${x + cell} ${y + cell}L${cx} ${y + cell - cell * 0.05}L${x + cell - k} ${cy}Z`;
      dartD += `M${x} ${y + cell}L${x + k} ${cy}L${cx} ${y + cell - cell * 0.05}Z`;
    }
  }
  g.appendChild(svgEl('path', {d: dartD, fill: dart}));
  g.appendChild(svgEl('path', {d: kiteD, fill: fg}));
  return g;
}

registerGenerator({name: 'kite-tiles', category: 'geometric', weight: 2, render});
