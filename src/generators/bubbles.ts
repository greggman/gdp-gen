/**
 * Layered translucent bubbles: many overlapping circles in palette colors at low
 * opacity, with the occasional rim highlight, so colors mix optically where they
 * stack. Sizes follow a Gaussian bias toward small bubbles with a few large
 * ones, like soda foam or a lava lamp.
 */
import {registerGenerator} from '../core/registry.js';
import {Color, DesignContext, Rect} from '../core/types.js';
import {baseFill, clipped, palettePair, svgEl} from './_generator.js';

function render(ctx: DesignContext, bounds: Rect): SVGElement {
  const {rng, palette} = ctx;
  const {bg} = palettePair(ctx, rng);
  const g = clipped(ctx, bounds);
  baseFill(g, bounds, bg);

  const swatches: Color[] = [
    palette.primary,
    palette.accent,
    palette.colors[1] ?? palette.primary,
    palette.colors[3] ?? palette.accent,
  ];

  const minDim = Math.min(bounds.w, bounds.h);
  const area = bounds.w * bounds.h;
  const count = Math.max(20, Math.min(700, Math.round(area / 1400)));
  const opacity = rng.range(0.18, 0.4);
  const stroke = rng.chance(0.5);

  for (let i = 0; i < count; i++) {
    const cx = bounds.x + rng.next() * bounds.w;
    const cy = bounds.y + rng.next() * bounds.h;
    // Bias small with a long tail toward large.
    const t = Math.abs(rng.gaussian(0, 0.5));
    const r = minDim * (0.02 + t * 0.12);
    const fill = rng.pick(swatches);
    const attrs: Record<string, string | number> = {
      cx: cx.toFixed(1),
      cy: cy.toFixed(1),
      r: r.toFixed(1),
      fill,
      'fill-opacity': opacity.toFixed(2),
    };
    if (stroke) {
      attrs['stroke'] = fill;
      attrs['stroke-opacity'] = (opacity + 0.2).toFixed(2);
      attrs['stroke-width'] = Math.max(0.6, r * 0.04).toFixed(1);
    }
    g.appendChild(svgEl('circle', attrs));
  }
  return g;
}

registerGenerator({name: 'bubbles', category: 'organic', weight: 2, render});
