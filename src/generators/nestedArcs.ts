/**
 * Nested arcs: a grid of cells, each holding a fan of nested concentric arcs
 * anchored at a corner -- a rainbow/scallop motif reminiscent of art-deco tile.
 */
import {registerGenerator} from '../core/registry.js';
import {DesignContext, Rect} from '../core/types.js';
import {baseFill, clipped, palettePair, svgEl} from './_generator.js';

function render(ctx: DesignContext, bounds: Rect): SVGElement {
  const {rng} = ctx;
  const {bg, fg} = palettePair(ctx, rng);
  const g = clipped(ctx, bounds);
  baseFill(g, bounds, bg);

  const cols = rng.int(2, 5);
  const cw = bounds.w / cols;
  const rows = Math.max(1, Math.round(bounds.h / cw));
  const ch = bounds.h / rows;
  const cell = Math.min(cw, ch);
  const stroke = Math.max(0.8, cell * rng.range(0.012, 0.025));
  const arcsPer = Math.min(14, Math.max(3, Math.round(cell / (stroke * 3))));
  const step = (cell * 0.95) / arcsPer;
  // Corners to anchor the arc fan at, expressed as unit offsets.
  const corners = [
    [0, 0],
    [1, 0],
    [0, 1],
    [1, 1],
  ] as const;

  let d = '';
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const ox = bounds.x + c * cw;
      const oy = bounds.y + r * ch;
      const corner = rng.pick(corners);
      const ax = ox + corner[0] * cw;
      const ay = oy + corner[1] * ch;
      const sweep = corner[0] === corner[1] ? 1 : 0;
      for (let i = 1; i <= arcsPer; i++) {
        const rad = i * step;
        const sx = (ax + (corner[0] ? -rad : rad)).toFixed(1);
        const sy = ay.toFixed(1);
        const ex = ax.toFixed(1);
        const ey = (ay + (corner[1] ? -rad : rad)).toFixed(1);
        d += `M${sx} ${sy}A${rad.toFixed(1)} ${rad.toFixed(1)} 0 0 ${sweep} ${ex} ${ey}`;
      }
    }
  }
  g.appendChild(
    svgEl('path', {d, stroke: fg, 'stroke-width': stroke.toFixed(2), fill: 'none'}),
  );
  return g;
}

registerGenerator({name: 'nested-arcs', category: 'lines', weight: 2, render});
