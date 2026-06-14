/**
 * A smooth spiral: an Archimedean spiral traced as a single stroked path that
 * winds out from the center to fill the region. Stroke width and turn count
 * vary for anything from a tight coil to a loose swirl.
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
  const maxR = Math.hypot(bounds.w, bounds.h) / 2;
  const turns = rng.range(4, 11);
  const dir = rng.chance() ? 1 : -1;
  const phase = rng.range(0, Math.PI * 2);
  const totalAngle = turns * Math.PI * 2;
  const steps = Math.min(1400, Math.round(turns * 90));

  let d = '';
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const a = dir * t * totalAngle + phase;
    const r = t * maxR;
    const x = (cx + Math.cos(a) * r).toFixed(2);
    const y = (cy + Math.sin(a) * r).toFixed(2);
    d += i === 0 ? `M${x} ${y}` : `L${x} ${y}`;
  }

  const strokeW = (maxR / turns) * rng.range(0.18, 0.5);
  g.appendChild(
    svgEl('path', {
      d,
      fill: 'none',
      stroke: fg,
      'stroke-width': strokeW.toFixed(2),
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
    }),
  );
  return g;
}

registerGenerator({name: 'spiral', category: 'radial', weight: 2, render});
