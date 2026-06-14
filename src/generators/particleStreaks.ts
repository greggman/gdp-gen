/**
 * Particle streaks: many short tapered lines all sharing a dominant motion
 * direction with jitter, suggesting particles caught mid-flight. Streaks are
 * grouped into a single stroked path; a few brighter accent streaks sit on top.
 */
import {registerGenerator} from '../core/registry.js';
import {Color, DesignContext, Rect} from '../core/types.js';
import {baseFill, clipped, palettePair, svgEl} from './_generator.js';

function render(ctx: DesignContext, bounds: Rect): SVGElement {
  const {rng, palette} = ctx;
  const {bg, fg} = palettePair(ctx, rng);
  const g = clipped(ctx, bounds);
  baseFill(g, bounds, bg);

  const minDim = Math.min(bounds.w, bounds.h);
  const baseAngle = rng.next() * Math.PI * 2;
  const angleJitter = rng.range(0.05, 0.4);
  const area = bounds.w * bounds.h;
  const count = Math.max(30, Math.min(900, Math.round(area / 1100)));
  const lenBase = minDim * rng.range(0.05, 0.16);

  let d = '';
  for (let i = 0; i < count; i++) {
    const x = bounds.x + rng.next() * bounds.w;
    const y = bounds.y + rng.next() * bounds.h;
    const ang = baseAngle + rng.gaussian(0, angleJitter);
    const len = lenBase * rng.range(0.4, 1.4);
    const ex = x + Math.cos(ang) * len;
    const ey = y + Math.sin(ang) * len;
    d += `M${x.toFixed(1)} ${y.toFixed(1)}L${ex.toFixed(1)} ${ey.toFixed(1)}`;
  }
  g.appendChild(
    svgEl('path', {
      d,
      stroke: fg,
      'stroke-width': Math.max(0.8, minDim * 0.004).toFixed(1),
      'stroke-opacity': rng.range(0.45, 0.8).toFixed(2),
      'stroke-linecap': 'round',
      fill: 'none',
    }),
  );

  // A scatter of brighter accent streaks on top.
  const accentColor: Color = palette.accent;
  const bright = rng.int(8, 24);
  let bd = '';
  for (let i = 0; i < bright; i++) {
    const x = bounds.x + rng.next() * bounds.w;
    const y = bounds.y + rng.next() * bounds.h;
    const ang = baseAngle + rng.gaussian(0, angleJitter);
    const len = lenBase * rng.range(1.0, 2.0);
    const ex = x + Math.cos(ang) * len;
    const ey = y + Math.sin(ang) * len;
    bd += `M${x.toFixed(1)} ${y.toFixed(1)}L${ex.toFixed(1)} ${ey.toFixed(1)}`;
  }
  g.appendChild(
    svgEl('path', {
      d: bd,
      stroke: accentColor,
      'stroke-width': Math.max(1.2, minDim * 0.007).toFixed(1),
      'stroke-linecap': 'round',
      fill: 'none',
    }),
  );
  return g;
}

registerGenerator({name: 'particle-streaks', category: 'scatter', weight: 2, render});
