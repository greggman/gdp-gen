/**
 * Gradient rings: concentric annular rings whose colors step around a palette
 * ramp from the center outward, with a soft radial gradient underneath so the
 * banded rings sit on a continuous blend.
 */
import {registerGenerator} from '../core/registry.js';
import {Color, DesignContext, Rect} from '../core/types.js';
import {baseFill, clipped, palettePair, svgEl} from './_generator.js';
import {uid} from '../core/renderer.js';

function render(ctx: DesignContext, bounds: Rect): SVGElement {
  const {rng, palette} = ctx;
  const {bg, fg} = palettePair(ctx, rng);
  const g = clipped(ctx, bounds);
  baseFill(g, bounds, bg);

  const cx = bounds.x + bounds.w * rng.range(0.35, 0.65);
  const cy = bounds.y + bounds.h * rng.range(0.35, 0.65);
  const maxR = Math.hypot(bounds.w, bounds.h);

  const id = uid('rings');
  const grad = svgEl('radialGradient', {id, cx: '0.5', cy: '0.5', r: '0.7'});
  grad.appendChild(svgEl('stop', {offset: '0', 'stop-color': fg}));
  grad.appendChild(svgEl('stop', {offset: '1', 'stop-color': bg}));
  const defs = svgEl('defs');
  defs.appendChild(grad);
  g.appendChild(defs);
  g.appendChild(
    svgEl('rect', {x: bounds.x, y: bounds.y, width: bounds.w, height: bounds.h, fill: `url(#${id})`}),
  );

  const ramp: Color[] = [fg, palette.accent, palette.primary, bg];
  const count = rng.int(8, 20);
  const step = maxR / count;
  const stroke = step * rng.range(0.4, 0.85);
  // Draw outermost-first so inner rings paint on top.
  for (let i = count; i >= 1; i--) {
    g.appendChild(
      svgEl('circle', {
        cx,
        cy,
        r: i * step,
        fill: 'none',
        stroke: ramp[i % ramp.length],
        'stroke-width': stroke.toFixed(2),
        'stroke-opacity': '0.85',
      }),
    );
  }
  return g;
}

registerGenerator({name: 'gradient-rings', category: 'gradient', weight: 2, render});
