/** Smooth two- or three-stop linear gradient at a random angle. */
import {registerGenerator} from '../core/registry.js';
import {Color, DesignContext, Rect} from '../core/types.js';
import {uid} from '../core/renderer.js';
import {baseFill, clipped, palettePair, svgEl} from './_generator.js';

function render(ctx: DesignContext, bounds: Rect): SVGElement {
  const {rng, palette} = ctx;
  const {bg, fg} = palettePair(ctx, rng);
  const g = clipped(ctx, bounds);
  baseFill(g, bounds, bg);

  const angle = rng.range(0, 360);
  const rad = (angle * Math.PI) / 180;
  const x2 = (Math.cos(rad) * 0.5 + 0.5).toFixed(3);
  const y2 = (Math.sin(rad) * 0.5 + 0.5).toFixed(3);
  const x1 = (1 - Number(x2)).toFixed(3);
  const y1 = (1 - Number(y2)).toFixed(3);

  const id = uid('grad');
  const grad = svgEl('linearGradient', {id, x1, y1, x2, y2});
  const stops: Array<[number, Color]> = rng.chance(0.5)
    ? [[0, bg], [1, fg]]
    : [[0, bg], [0.5, fg], [1, palette.accent]];
  for (const [offset, color] of stops) {
    grad.appendChild(svgEl('stop', {offset, 'stop-color': color}));
  }
  const defs = svgEl('defs');
  defs.appendChild(grad);
  g.appendChild(defs);
  g.appendChild(
    svgEl('rect', {x: bounds.x, y: bounds.y, width: bounds.w, height: bounds.h, fill: `url(#${id})`}),
  );
  return g;
}

registerGenerator({name: 'linear-gradient', category: 'gradient', weight: 3, render});
