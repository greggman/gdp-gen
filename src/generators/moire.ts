/**
 * Moire: two overlaid line grids at slightly different angles and spacings,
 * whose interference produces shimmering op-art bands.
 */
import {registerGenerator} from '../core/registry.js';
import {Color, DesignContext, Rect} from '../core/types.js';
import {baseFill, clipped, palettePair, svgEl} from './_generator.js';

function lineGrid(
  cx: number,
  cy: number,
  diag: number,
  angle: number,
  spacing: number,
  stroke: number,
  color: Color,
  opacity: number,
): SVGGElement {
  const count = Math.min(420, Math.ceil(diag / spacing) + 1);
  let d = '';
  for (let i = 0; i < count; i++) {
    const y = (cy - diag / 2 + i * spacing).toFixed(1);
    d += `M${(cx - diag / 2).toFixed(1)} ${y}H${(cx + diag / 2).toFixed(1)}`;
  }
  const rot = svgEl('g', {transform: `rotate(${angle.toFixed(2)} ${cx} ${cy})`});
  rot.appendChild(
    svgEl('path', {
      d,
      stroke: color,
      'stroke-width': stroke.toFixed(2),
      fill: 'none',
      'stroke-opacity': opacity.toFixed(2),
    }),
  );
  return rot;
}

function render(ctx: DesignContext, bounds: Rect): SVGElement {
  const {rng} = ctx;
  const {bg, fg} = palettePair(ctx, rng);
  const g = clipped(ctx, bounds);
  baseFill(g, bounds, bg);

  const cx = bounds.x + bounds.w / 2;
  const cy = bounds.y + bounds.h / 2;
  const diag = Math.hypot(bounds.w, bounds.h);
  const stroke = Math.max(0.6, Math.min(bounds.w, bounds.h) * rng.range(0.004, 0.009));
  const spacing = stroke * rng.range(2.5, 4.5);
  const angleA = rng.int(0, 180);
  const angleB = angleA + rng.range(2, 12) * (rng.chance() ? 1 : -1);
  const second = ctx.palette.accent;

  g.appendChild(lineGrid(cx, cy, diag, angleA, spacing, stroke, fg, 0.85));
  g.appendChild(
    lineGrid(cx, cy, diag, angleB, spacing * rng.range(0.92, 1.08), stroke, second, 0.7),
  );
  return g;
}

registerGenerator({name: 'moire', category: 'lines', weight: 2, render});
