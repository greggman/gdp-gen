/**
 * Gradient bars: the region is split into a stack of parallel bars, each filled
 * with its own linear gradient between two palette colors. Bar orientation,
 * count, and gradient direction are randomized for a layered, screen-print feel.
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

  const defs = svgEl('defs');
  g.appendChild(defs);

  const vertical = rng.chance(0.5);
  const count = rng.int(4, 12);
  const ramp: Color[] = [fg, palette.accent, palette.primary, bg];
  const span = vertical ? bounds.h : bounds.w;
  const thickness = span / count;
  // Flip the gradient axis bar-to-bar for an interleaved look.
  const alternate = rng.chance(0.6);

  for (let i = 0; i < count; i++) {
    const id = uid('bar');
    const flip = alternate && i % 2 === 1;
    const grad = svgEl('linearGradient', {
      id,
      x1: vertical ? '0' : flip ? '1' : '0',
      y1: vertical ? (flip ? '1' : '0') : '0',
      x2: vertical ? '0' : flip ? '0' : '1',
      y2: vertical ? (flip ? '0' : '1') : '0',
    });
    const c0 = ramp[i % ramp.length];
    const c1 = ramp[(i + rng.int(1, 2)) % ramp.length];
    grad.appendChild(svgEl('stop', {offset: '0', 'stop-color': c0}));
    grad.appendChild(svgEl('stop', {offset: '1', 'stop-color': c1}));
    defs.appendChild(grad);

    g.appendChild(
      svgEl('rect', {
        x: vertical ? bounds.x : bounds.x + i * thickness,
        y: vertical ? bounds.y + i * thickness : bounds.y,
        width: vertical ? bounds.w : thickness + 0.5,
        height: vertical ? thickness + 0.5 : bounds.h,
        fill: `url(#${id})`,
      }),
    );
  }
  return g;
}

registerGenerator({name: 'gradient-bars', category: 'gradient', weight: 2, render});
