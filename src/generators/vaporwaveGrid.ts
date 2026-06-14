/**
 * Vaporwave neon perspective grid: a glowing grid receding toward a horizon
 * line on the upper half, with evenly spaced verticals converging to a vanishing
 * point and horizontals bunching up toward the horizon -- the classic 80s look.
 */
import {registerGenerator} from '../core/registry.js';
import {DesignContext, Rect} from '../core/types.js';
import {baseFill, clipped, palettePair, svgEl} from './_generator.js';

function render(ctx: DesignContext, bounds: Rect): SVGElement {
  const {rng, palette} = ctx;
  const {bg, fg} = palettePair(ctx, rng);
  const neon = palette.accent === fg ? palette.primary : palette.accent;
  const g = clipped(ctx, bounds);
  baseFill(g, bounds, bg);

  // Horizon sits in the upper region; grid floor fills below it.
  const horizonY = bounds.y + bounds.h * rng.range(0.28, 0.42);
  const vpx = bounds.x + bounds.w / 2;
  const bottom = bounds.y + bounds.h;
  const stroke = Math.max(1, Math.min(bounds.w, bounds.h) * 0.004);

  // Horizon glow line.
  g.appendChild(
    svgEl('line', {
      x1: bounds.x, y1: horizonY, x2: bounds.x + bounds.w, y2: horizonY,
      stroke: neon, 'stroke-width': stroke * 2,
    }),
  );

  // Converging verticals: evenly spaced along the bottom edge, all aiming at
  // the vanishing point on the horizon.
  let dV = '';
  const cols = rng.int(8, 16);
  for (let i = 0; i <= cols; i++) {
    const bx = bounds.x + (i / cols) * bounds.w;
    dV += `M${bx.toFixed(1)} ${bottom.toFixed(1)}L${vpx.toFixed(1)} ${horizonY.toFixed(1)}`;
  }
  g.appendChild(svgEl('path', {d: dV, stroke: fg, 'stroke-width': stroke, fill: 'none'}));

  // Horizontals: spacing grows toward the viewer (perspective), drawn as full
  // width lines below the horizon.
  let dH = '';
  const rowsN = rng.int(8, 14);
  for (let i = 1; i <= rowsN; i++) {
    // Geometric progression so near rows are far apart, far rows bunch up.
    const t = Math.pow(i / rowsN, 2.2);
    const y = horizonY + t * (bottom - horizonY);
    dH += `M${bounds.x.toFixed(1)} ${y.toFixed(1)}h${bounds.w.toFixed(1)}`;
  }
  g.appendChild(svgEl('path', {d: dH, stroke: fg, 'stroke-width': stroke, fill: 'none'}));

  // A glowing sun disc above the horizon.
  const sunR = bounds.w * rng.range(0.1, 0.18);
  g.appendChild(
    svgEl('circle', {
      cx: vpx, cy: horizonY - sunR * rng.range(0.2, 0.9), r: sunR, fill: neon,
    }),
  );
  return g;
}

registerGenerator({name: 'vaporwave-grid', category: 'retro', weight: 2, render});
