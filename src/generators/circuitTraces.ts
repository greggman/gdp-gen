/**
 * Circuit traces: PCB-like routing. Axis-aligned and 45-degree trace runs that
 * step across the region, capped by round solder pads, evoking a printed
 * circuit board.
 */
import {registerGenerator} from '../core/registry.js';
import {DesignContext, Rect} from '../core/types.js';
import {baseFill, clipped, palettePair, svgEl} from './_generator.js';

function render(ctx: DesignContext, bounds: Rect): SVGElement {
  const {rng} = ctx;
  const {bg, fg} = palettePair(ctx, rng);
  const g = clipped(ctx, bounds);
  baseFill(g, bounds, bg);

  const cell = Math.max(14, Math.min(bounds.w, bounds.h) / rng.int(12, 22));
  const cols = Math.ceil(bounds.w / cell);
  const rows = Math.ceil(bounds.h / cell);
  const traceCount = Math.min(220, Math.round((cols * rows) / rng.range(3, 6)));
  const stroke = Math.max(1.5, cell * rng.range(0.08, 0.16));
  const pads: Array<[number, number]> = [];

  let d = '';
  for (let t = 0; t < traceCount; t++) {
    let cx = rng.int(0, cols);
    let cy = rng.int(0, rows);
    let px = bounds.x + cx * cell;
    let py = bounds.y + cy * cell;
    d += `M${px.toFixed(1)} ${py.toFixed(1)}`;
    pads.push([px, py]);
    const segs = rng.int(2, 5);
    for (let s = 0; s < segs; s++) {
      const dir = rng.pick(['h', 'v', 'd'] as const);
      const len = rng.int(1, 4);
      if (dir === 'h') {
        cx = Math.max(0, Math.min(cols, cx + (rng.chance() ? len : -len)));
      } else if (dir === 'v') {
        cy = Math.max(0, Math.min(rows, cy + (rng.chance() ? len : -len)));
      } else {
        const sx = rng.chance() ? 1 : -1;
        const sy = rng.chance() ? 1 : -1;
        cx = Math.max(0, Math.min(cols, cx + sx * len));
        cy = Math.max(0, Math.min(rows, cy + sy * len));
      }
      px = bounds.x + cx * cell;
      py = bounds.y + cy * cell;
      d += `L${px.toFixed(1)} ${py.toFixed(1)}`;
    }
    pads.push([px, py]);
  }
  g.appendChild(
    svgEl('path', {
      d,
      fill: 'none',
      stroke: fg,
      'stroke-width': stroke.toFixed(2),
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
      'stroke-opacity': '0.85',
    }),
  );

  // Solder pads at trace ends: a ring of larger dots.
  const padR = stroke * rng.range(1.6, 2.4);
  let pd = '';
  const seen = new Set<string>();
  for (const [x, y] of pads) {
    const key = `${x.toFixed(0)},${y.toFixed(0)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    pd += `M${(x - padR).toFixed(1)} ${y.toFixed(1)}a${padR.toFixed(1)} ${padR.toFixed(1)} 0 1 0 ${(padR * 2).toFixed(1)} 0a${padR.toFixed(1)} ${padR.toFixed(1)} 0 1 0 ${(-padR * 2).toFixed(1)} 0z`;
  }
  g.appendChild(svgEl('path', {d: pd, fill: fg}));
  return g;
}

registerGenerator({name: 'circuit-traces', category: 'techno', weight: 2, render});
