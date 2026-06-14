/**
 * Log-cabin quilt blocks: a grid of squares, each built from concentric L-shaped
 * "logs" wound around a central hearth square. Two adjacent sides of every ring
 * get the foreground family while the opposite two show the background, creating
 * the signature diagonal light/dark split of a log-cabin quilt.
 */
import {registerGenerator} from '../core/registry.js';
import {DesignContext, Rect} from '../core/types.js';
import {baseFill, clipped, palettePair, svgEl} from './_generator.js';

function render(ctx: DesignContext, bounds: Rect): SVGElement {
  const {rng, palette} = ctx;
  const {bg, fg} = palettePair(ctx, rng);
  const hearth = fg === palette.accent ? palette.primary : palette.accent;
  const g = clipped(ctx, bounds);
  baseFill(g, bounds, bg);

  const cols = rng.int(2, 4);
  const cell = bounds.w / cols;
  const rows = Math.ceil(bounds.h / cell) + 1;
  const logs = rng.int(3, 4); // Rings around the hearth.
  const lw = cell / (2 * logs + 1); // Uniform log width incl. the hearth.

  let fgD = '';
  let hearthD = '';
  for (let r = -1; r < rows; r++) {
    for (let c = -1; c <= cols; c++) {
      const bx = bounds.x + c * cell;
      const by = bounds.y + r * cell;
      // Hearth square sits dead center.
      const hx = bx + logs * lw;
      const hy = by + logs * lw;
      hearthD += `M${hx} ${hy}h${lw}v${lw}h${-lw}z`;
      // Each ring `k` (0 = innermost) frames a box; we paint its TOP and RIGHT
      // logs in fg. Background ring logs (bottom/left) are left as base bg.
      for (let k = 0; k < logs; k++) {
        const lo = (logs - 1 - k) * lw; // Outer offset of this ring from cell edge.
        const x0 = bx + lo;
        const y0 = by + lo;
        const span = cell - 2 * lo; // Full outer extent of the ring box.
        // Top log: full width along the top edge of the ring box.
        fgD += `M${x0} ${y0}h${span}v${lw}h${-span}z`;
        // Right log: full height along the right edge (below the top log).
        fgD += `M${x0 + span - lw} ${y0 + lw}h${lw}v${span - lw}h${-lw}z`;
      }
    }
  }
  g.appendChild(svgEl('path', {d: fgD, fill: fg}));
  g.appendChild(svgEl('path', {d: hearthD, fill: hearth}));
  return g;
}

registerGenerator({name: 'log-cabin', category: 'geometric', weight: 2, render});
