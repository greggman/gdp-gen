/**
 * Duotone fade: a soft two-tone blend between exactly two palette colors, in the
 * spirit of a duotone photo treatment. A gentle diagonal or vertical gradient
 * carries the eye from one tone to the other with a single mid stop for depth.
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

  const angle = rng.pick([0, Math.PI / 2, Math.PI / 4, (3 * Math.PI) / 4]);
  const dx = Math.cos(angle);
  const dy = Math.sin(angle);
  const id = uid('duo');
  const grad = svgEl('linearGradient', {
    id,
    x1: (0.5 - dx * 0.5).toFixed(3),
    y1: (0.5 - dy * 0.5).toFixed(3),
    x2: (0.5 + dx * 0.5).toFixed(3),
    y2: (0.5 + dy * 0.5).toFixed(3),
  });
  const reverse = rng.chance(0.5);
  const a = reverse ? bg : fg;
  const b = reverse ? fg : bg;
  // A soft S-curve via a weighted mid stop keeps the fade gentle, not linear.
  const mid = rng.range(0.4, 0.6).toFixed(3);
  grad.appendChild(svgEl('stop', {offset: '0', 'stop-color': a}));
  grad.appendChild(svgEl('stop', {offset: mid, 'stop-color': a, 'stop-opacity': '0.7'}));
  grad.appendChild(svgEl('stop', {offset: '1', 'stop-color': b}));
  const defs = svgEl('defs');
  defs.appendChild(grad);
  g.appendChild(defs);
  g.appendChild(
    svgEl('rect', {x: bounds.x, y: bounds.y, width: bounds.w, height: bounds.h, fill: b}),
  );
  g.appendChild(
    svgEl('rect', {x: bounds.x, y: bounds.y, width: bounds.w, height: bounds.h, fill: `url(#${id})`}),
  );
  return g;
}

registerGenerator({name: 'duotone-fade', category: 'gradient', weight: 2, render});
