/**
 * Vignette: a flat field of color with darkened (or lightened) edges produced by
 * a radial gradient that is transparent at the center and opaque toward the
 * corners. A classic photographic / poster framing device.
 */
import {registerGenerator} from '../core/registry.js';
import {DesignContext, Rect} from '../core/types.js';
import {baseFill, clipped, palettePair, svgEl} from './_generator.js';
import {uid} from '../core/renderer.js';

function render(ctx: DesignContext, bounds: Rect): SVGElement {
  const {rng, palette} = ctx;
  const {bg, fg} = palettePair(ctx, rng);
  const g = clipped(ctx, bounds);
  // The base field is the brighter/primary color; edges fade toward bg.
  baseFill(g, bounds, fg);

  const id = uid('vig');
  const cx = rng.range(0.4, 0.6);
  const cy = rng.range(0.4, 0.6);
  const grad = svgEl('radialGradient', {
    id,
    cx: cx.toFixed(3),
    cy: cy.toFixed(3),
    r: rng.range(0.6, 0.85).toFixed(3),
  });
  const edge = rng.chance(0.5) ? bg : palette.accent;
  const inner = rng.range(0.0, 0.15).toFixed(2);
  const mid = rng.range(0.5, 0.7).toFixed(2);
  grad.appendChild(svgEl('stop', {offset: '0', 'stop-color': edge, 'stop-opacity': inner}));
  grad.appendChild(svgEl('stop', {offset: mid, 'stop-color': edge, 'stop-opacity': '0.1'}));
  grad.appendChild(
    svgEl('stop', {offset: '1', 'stop-color': edge, 'stop-opacity': rng.range(0.75, 0.95).toFixed(2)}),
  );
  const defs = svgEl('defs');
  defs.appendChild(grad);
  g.appendChild(defs);
  g.appendChild(
    svgEl('rect', {x: bounds.x, y: bounds.y, width: bounds.w, height: bounds.h, fill: `url(#${id})`}),
  );
  return g;
}

registerGenerator({name: 'vignette', category: 'gradient', weight: 1, render});
