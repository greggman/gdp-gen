/**
 * Perspective checker floor: a checkerboard projected into a receding floor
 * plane. Columns converge toward a vanishing point on a horizon and rows bunch
 * up with distance, producing the infinite-tiled-floor illusion. Each dark
 * quad is emitted into one combined path.
 */
import {registerGenerator} from '../core/registry.js';
import {DesignContext, Rect} from '../core/types.js';
import {baseFill, clipped, palettePair, svgEl} from './_generator.js';

function render(ctx: DesignContext, bounds: Rect): SVGElement {
  const {rng} = ctx;
  const {bg, fg} = palettePair(ctx, rng);
  const g = clipped(ctx, bounds);
  baseFill(g, bounds, bg);

  const horizonY = bounds.y + bounds.h * rng.range(0.02, 0.18);
  const vpx = bounds.x + bounds.w / 2;
  const bottom = bounds.y + bounds.h;
  const cols = rng.int(6, 12); // half-columns each side of center.
  const rows = rng.int(8, 16);

  // Row depth boundaries via geometric progression (near rows tall, far short).
  const rowY: number[] = [];
  for (let r = 0; r <= rows; r++) {
    const t = Math.pow(r / rows, 2.4);
    rowY.push(bottom - t * (bottom - horizonY));
  }

  // x position of column line `c` (0..2*cols) at a given y, interpolating from
  // evenly spaced at the bottom to all-converged at the vanishing point.
  const colCount = cols * 2;
  const xAt = (c: number, y: number): number => {
    const bottomX = bounds.x + (c / colCount) * bounds.w;
    const f = (bottom - y) / (bottom - horizonY); // 0 at bottom, 1 at horizon.
    return bottomX + (vpx - bottomX) * f;
  };

  let d = '';
  for (let r = 0; r < rows; r++) {
    const yTop = rowY[r + 1];
    const yBot = rowY[r];
    for (let c = 0; c < colCount; c++) {
      if ((r + c) % 2 !== 0) continue;
      const x0t = xAt(c, yTop);
      const x1t = xAt(c + 1, yTop);
      const x1b = xAt(c + 1, yBot);
      const x0b = xAt(c, yBot);
      d +=
        `M${x0t.toFixed(1)} ${yTop.toFixed(1)}` +
        `L${x1t.toFixed(1)} ${yTop.toFixed(1)}` +
        `L${x1b.toFixed(1)} ${yBot.toFixed(1)}` +
        `L${x0b.toFixed(1)} ${yBot.toFixed(1)}Z`;
    }
  }
  g.appendChild(svgEl('path', {d, fill: fg}));
  return g;
}

registerGenerator({name: 'checker-floor-persp', category: 'geometric', weight: 2, render});
