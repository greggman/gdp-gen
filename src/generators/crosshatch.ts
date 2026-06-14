/**
 * Crosshatch: two or three layers of parallel hatch lines at different angles,
 * stacked with partial opacity to build a hand-drawn, engraving-like texture.
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
  const diag = Math.hypot(bounds.w, bounds.h);
  const layers = rng.int(2, 3);
  const baseAngle = rng.int(0, 180);
  const angleStep = rng.pick([45, 60, 90]);
  const stroke = Math.max(0.6, Math.min(bounds.w, bounds.h) * rng.range(0.003, 0.008));
  const spacing = stroke * rng.range(2.5, 5);
  // Cap line nodes across all layers.
  const perLayer = Math.min(360, Math.ceil(diag / spacing) + 1);

  for (let l = 0; l < layers; l++) {
    const angle = baseAngle + l * angleStep + rng.range(-4, 4);
    const rot = svgEl('g', {transform: `rotate(${angle.toFixed(2)} ${cx} ${cy})`});
    let d = '';
    for (let i = 0; i < perLayer; i++) {
      const y = (cy - diag / 2 + i * spacing).toFixed(1);
      const x0 = (cx - diag / 2).toFixed(1);
      const x1 = (cx + diag / 2).toFixed(1);
      d += `M${x0} ${y}H${x1}`;
    }
    rot.appendChild(
      svgEl('path', {
        d,
        stroke: fg,
        'stroke-width': stroke.toFixed(2),
        fill: 'none',
        'stroke-opacity': rng.range(0.45, 0.8).toFixed(2),
      }),
    );
    g.appendChild(rot);
  }
  return g;
}

registerGenerator({name: 'crosshatch', category: 'lines', weight: 2, render});
