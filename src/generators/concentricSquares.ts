/**
 * Concentric squares: nested square (or rectangle) outlines stepping inward
 * from the bounds toward a chosen center point, an op-art tunnel effect.
 */
import {registerGenerator} from '../core/registry.js';
import {DesignContext, Rect} from '../core/types.js';
import {baseFill, clipped, palettePair, svgEl} from './_generator.js';

function render(ctx: DesignContext, bounds: Rect): SVGElement {
  const {rng} = ctx;
  const {bg, fg} = palettePair(ctx, rng);
  const g = clipped(ctx, bounds);
  baseFill(g, bounds, bg);

  // Center can be offset to skew the perspective of the tunnel.
  const cx = bounds.x + bounds.w * rng.range(0.3, 0.7);
  const cy = bounds.y + bounds.h * rng.range(0.3, 0.7);
  const reach = Math.max(
    Math.hypot(bounds.x - cx, bounds.y - cy),
    Math.hypot(bounds.x + bounds.w - cx, bounds.y - cy),
    Math.hypot(bounds.x - cx, bounds.y + bounds.h - cy),
    Math.hypot(bounds.x + bounds.w - cx, bounds.y + bounds.h - cy),
  );
  const stroke = Math.max(0.8, Math.min(bounds.w, bounds.h) * rng.range(0.004, 0.01));
  const step = stroke * rng.range(3, 7);
  const count = Math.min(220, Math.ceil(reach / step));
  const aspect = rng.range(0.8, 1.25);

  let d = '';
  for (let i = count; i >= 1; i--) {
    const hw = i * step;
    const hh = i * step * aspect;
    const x0 = (cx - hw).toFixed(1);
    const y0 = (cy - hh).toFixed(1);
    const x1 = (cx + hw).toFixed(1);
    const y1 = (cy + hh).toFixed(1);
    d += `M${x0} ${y0}H${x1}V${y1}H${x0}Z`;
  }
  g.appendChild(
    svgEl('path', {d, stroke: fg, 'stroke-width': stroke.toFixed(2), fill: 'none'}),
  );
  return g;
}

registerGenerator({name: 'concentric-squares', category: 'lines', weight: 2, render});
