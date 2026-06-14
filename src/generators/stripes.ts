/** Parallel stripes at a chosen angle and width. A graphic-design staple. */
import {registerGenerator} from '../core/registry.js';
import {DesignContext, Rect} from '../core/types.js';
import {baseFill, clipped, palettePair, svgEl} from './_generator.js';

function render(ctx: DesignContext, bounds: Rect): SVGElement {
  const {rng} = ctx;
  const {bg, fg} = palettePair(ctx, rng);
  const g = clipped(ctx, bounds);
  baseFill(g, bounds, bg);

  const angle = rng.pick([0, 45, 90, 135, rng.int(0, 180)]);
  const cx = bounds.x + bounds.w / 2;
  const cy = bounds.y + bounds.h / 2;
  const diag = Math.hypot(bounds.w, bounds.h);
  const count = rng.int(5, 24);
  const step = diag / count;
  const stripeW = step * rng.range(0.3, 0.6);

  const rot = svgEl('g', {transform: `rotate(${angle} ${cx} ${cy})`});
  for (let i = 0; i <= count; i++) {
    const x = cx - diag / 2 + i * step;
    rot.appendChild(
      svgEl('rect', {x, y: cy - diag / 2, width: stripeW, height: diag, fill: fg}),
    );
  }
  g.appendChild(rot);
  return g;
}

registerGenerator({name: 'stripes', category: 'geometric', weight: 3, render});
