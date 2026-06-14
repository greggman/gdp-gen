/**
 * Line wave field: a stack of horizontal lines, each displaced vertically by a
 * sine wave whose phase drifts row to row, giving a flowing, rippled surface.
 */
import {registerGenerator} from '../core/registry.js';
import {DesignContext, Rect} from '../core/types.js';
import {baseFill, clipped, palettePair, svgEl} from './_generator.js';

function render(ctx: DesignContext, bounds: Rect): SVGElement {
  const {rng} = ctx;
  const {bg, fg} = palettePair(ctx, rng);
  const g = clipped(ctx, bounds);
  baseFill(g, bounds, bg);

  const stroke = Math.max(0.8, Math.min(bounds.w, bounds.h) * rng.range(0.003, 0.007));
  const rows = Math.min(160, Math.max(12, Math.round(bounds.h / (stroke * rng.range(4, 9)))));
  const rowStep = bounds.h / rows;
  const cycles = rng.range(1.2, 3.5);
  const omega = (cycles * Math.PI * 2) / bounds.w;
  const amp = rowStep * rng.range(0.8, 2.2);
  const phaseDrift = rng.range(0.05, 0.25);
  const samples = Math.min(80, Math.max(24, Math.round(bounds.w / 12)));
  const dx = bounds.w / samples;

  let d = '';
  for (let r = 0; r <= rows; r++) {
    const baseY = bounds.y + r * rowStep;
    const phase = r * phaseDrift;
    for (let s = 0; s <= samples; s++) {
      const x = bounds.x + s * dx;
      const y = baseY + amp * Math.sin(omega * (x - bounds.x) + phase);
      d += `${s === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`;
    }
  }
  g.appendChild(
    svgEl('path', {
      d,
      stroke: fg,
      'stroke-width': stroke.toFixed(2),
      fill: 'none',
      'stroke-linecap': 'round',
    }),
  );
  return g;
}

registerGenerator({name: 'line-wave-field', category: 'lines', weight: 2, render});
