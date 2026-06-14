/**
 * Color blend blobs: several large, soft-edged radial-gradient circles in the
 * palette colors, scattered and overlapping with a lighten/screen-like additive
 * feel via partial opacity, so where they meet new blended tones appear -- a
 * gentle, gradient-mesh-ish wash.
 */
import {registerGenerator} from '../core/registry.js';
import {Color, DesignContext, Rect} from '../core/types.js';
import {uid} from '../core/renderer.js';
import {baseFill, clipped, palettePair, svgEl} from './_generator.js';

function render(ctx: DesignContext, bounds: Rect): SVGElement {
  const {rng, palette} = ctx;
  const {bg} = palettePair(ctx, rng);
  const g = clipped(ctx, bounds);
  baseFill(g, bounds, bg);

  const defs = svgEl('defs');
  g.appendChild(defs);

  const swatches: Color[] = [
    palette.primary,
    palette.accent,
    ...palette.colors,
  ];
  const minDim = Math.min(bounds.w, bounds.h);
  const count = rng.int(6, 11);
  for (let i = 0; i < count; i++) {
    const color = rng.pick(swatches);
    const id = uid('blob');
    const grad = svgEl('radialGradient', {id});
    grad.appendChild(svgEl('stop', {offset: '0', 'stop-color': color, 'stop-opacity': '0.9'}));
    grad.appendChild(svgEl('stop', {offset: '0.55', 'stop-color': color, 'stop-opacity': '0.5'}));
    grad.appendChild(svgEl('stop', {offset: '1', 'stop-color': color, 'stop-opacity': '0'}));
    defs.appendChild(grad);

    const cx = bounds.x + rng.range(-0.1, 1.1) * bounds.w;
    const cy = bounds.y + rng.range(-0.1, 1.1) * bounds.h;
    const r = minDim * rng.range(0.3, 0.6);
    g.appendChild(svgEl('circle', {cx: cx.toFixed(1), cy: cy.toFixed(1), r: r.toFixed(1), fill: `url(#${id})`}));
  }
  return g;
}

registerGenerator({name: 'color-blend-blobs', category: 'gradient', weight: 2, render});
