/**
 * Basket weave: pairs of parallel rectangles alternating between horizontal and
 * vertical orientation across a grid, like woven straps over and under one
 * another. Strap pairs use palette colors and sit on a contrasting ground.
 */
import {registerGenerator} from '../core/registry.js';
import {Color, DesignContext, Rect} from '../core/types.js';
import {baseFill, clipped, palettePair, svgEl} from './_generator.js';

function render(ctx: DesignContext, bounds: Rect): SVGElement {
  const {rng, palette} = ctx;
  const {bg, fg} = palettePair(ctx, rng);
  const g = clipped(ctx, bounds);
  baseFill(g, bounds, bg);

  const colorA = fg;
  const colorB = palette.accent;
  const cols = rng.int(3, 7);
  const cell = bounds.w / cols;
  const rows = Math.ceil(bounds.h / cell) + 1;
  const gap = cell * rng.range(0.06, 0.12);
  const straps = 2; // two slats per block
  const slat = (cell - gap * (straps + 1)) / straps;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = bounds.x + c * cell;
      const y = bounds.y + r * cell;
      // Checker which blocks are woven horizontal vs vertical.
      const horizontal = (r + c) % 2 === 0;
      const fill: Color = horizontal ? colorA : colorB;
      for (let s = 0; s < straps; s++) {
        if (horizontal) {
          g.appendChild(
            svgEl('rect', {
              x: x + gap,
              y: y + gap + s * (slat + gap),
              width: cell - gap * 2,
              height: slat,
              fill,
            }),
          );
        } else {
          g.appendChild(
            svgEl('rect', {
              x: x + gap + s * (slat + gap),
              y: y + gap,
              width: slat,
              height: cell - gap * 2,
              fill,
            }),
          );
        }
      }
    }
  }
  return g;
}

registerGenerator({name: 'basket-weave', category: 'tiling', weight: 2, render});
