/**
 * Radial gradient: a smooth circular color blend from a center point out to the
 * edges. The focal point, spread, and the two palette roles that map to the
 * inner/outer stops are randomized for variety.
 */
import {registerGenerator} from '../core/registry.js';
import {DesignContext, Rect} from '../core/types.js';
import {baseFill, clipped, palettePair, svgEl} from './_generator.js';
import {uid} from '../core/renderer.js';

function render(ctx: DesignContext, bounds: Rect): SVGElement {
  const {rng} = ctx;
  const {bg, fg} = palettePair(ctx, rng);
  const g = clipped(ctx, bounds);
  baseFill(g, bounds, bg);

  const id = uid('rad');
  const cx = rng.range(0.25, 0.75);
  const cy = rng.range(0.25, 0.75);
  const radius = rng.range(0.7, 1.2);
  const grad = svgEl('radialGradient', {
    id,
    cx: cx.toFixed(3),
    cy: cy.toFixed(3),
    r: radius.toFixed(3),
    fx: (cx + rng.range(-0.1, 0.1)).toFixed(3),
    fy: (cy + rng.range(-0.1, 0.1)).toFixed(3),
  });
  const stops = rng.int(2, 3);
  for (let i = 0; i <= stops; i++) {
    const t = i / stops;
    grad.appendChild(
      svgEl('stop', {
        offset: t.toFixed(3),
        'stop-color': i % 2 === 0 ? fg : bg,
      }),
    );
  }
  const defs = svgEl('defs');
  defs.appendChild(grad);
  g.appendChild(defs);
  g.appendChild(
    svgEl('rect', {
      x: bounds.x,
      y: bounds.y,
      width: bounds.w,
      height: bounds.h,
      fill: `url(#${id})`,
    }),
  );
  return g;
}

registerGenerator({name: 'radial-gradient', category: 'gradient', weight: 2, render});
