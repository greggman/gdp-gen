/**
 * Target rings: bold concentric circles alternating between two colors, like a
 * shooting target or op-art bullseye. Ring thickness can be even or vary.
 */
import {registerGenerator} from '../core/registry.js';
import {DesignContext, Rect} from '../core/types.js';
import {baseFill, clipped, palettePair, svgEl} from './_generator.js';

function render(ctx: DesignContext, bounds: Rect): SVGElement {
  const {rng} = ctx;
  const {bg, fg} = palettePair(ctx, rng);
  const g = clipped(ctx, bounds);
  // The outermost ring is the bg color; draw circles largest-first on top.
  baseFill(g, bounds, fg);

  // Bullseye may sit off-center for a dynamic composition.
  const cx = bounds.x + bounds.w * (rng.chance(0.7) ? 0.5 : rng.range(0.25, 0.75));
  const cy = bounds.y + bounds.h * (rng.chance(0.7) ? 0.5 : rng.range(0.25, 0.75));
  const maxR = Math.hypot(
    Math.max(cx - bounds.x, bounds.x + bounds.w - cx),
    Math.max(cy - bounds.y, bounds.y + bounds.h - cy),
  );
  const rings = rng.int(4, 10);
  const colors = [bg, fg];

  for (let i = rings; i >= 1; i--) {
    const r = (i / rings) * maxR;
    g.appendChild(
      svgEl('circle', {
        cx: cx.toFixed(2),
        cy: cy.toFixed(2),
        r: r.toFixed(2),
        fill: colors[(rings - i) % 2],
      }),
    );
  }
  return g;
}

registerGenerator({name: 'target-rings', category: 'radial', weight: 2, render});
