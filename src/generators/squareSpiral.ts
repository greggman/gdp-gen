/**
 * Square spiral: a single continuous right-angled path that winds inward from
 * the edge to the center, a minimal hypnotic op-art line.
 */
import {registerGenerator} from '../core/registry.js';
import {DesignContext, Rect} from '../core/types.js';
import {baseFill, clipped, palettePair, svgEl} from './_generator.js';

function render(ctx: DesignContext, bounds: Rect): SVGElement {
  const {rng} = ctx;
  const {bg, fg} = palettePair(ctx, rng);
  const g = clipped(ctx, bounds);
  baseFill(g, bounds, bg);

  const cx = bounds.x + bounds.w / 2;
  const cy = bounds.y + bounds.h / 2;
  const stroke = Math.max(1, Math.min(bounds.w, bounds.h) * rng.range(0.004, 0.012));
  const step = stroke * rng.range(3, 8);
  const limit = Math.max(bounds.w, bounds.h) / 2 + step;
  const cap = 900;

  // Walk outward in right-angle segments of growing length, then reverse the
  // point list so the drawn path spirals inward to the center.
  const pts: Array<[number, number]> = [[cx, cy]];
  const dirs = [
    [1, 0],
    [0, 1],
    [-1, 0],
    [0, -1],
  ];
  let x = cx;
  let y = cy;
  let leg = step;
  let di = 0;
  while (pts.length < cap) {
    for (let twice = 0; twice < 2; twice++) {
      const [dx, dy] = dirs[di % 4];
      x += dx * leg;
      y += dy * leg;
      pts.push([x, y]);
      di++;
    }
    leg += step;
    if (leg > limit * 2) break;
  }

  let d = '';
  for (let i = pts.length - 1; i >= 0; i--) {
    const [px, py] = pts[i];
    d += `${i === pts.length - 1 ? 'M' : 'L'}${px.toFixed(1)} ${py.toFixed(1)}`;
  }
  g.appendChild(
    svgEl('path', {
      d,
      stroke: fg,
      'stroke-width': stroke.toFixed(2),
      fill: 'none',
      'stroke-linejoin': 'miter',
    }),
  );
  return g;
}

registerGenerator({name: 'square-spiral', category: 'lines', weight: 2, render});
