/**
 * Brick wall: horizontal rows of rectangular bricks, each row offset by half a
 * brick (running bond). Mortar shows through as the background; bricks vary
 * slightly in tone using palette colors for a hand-laid masonry feel.
 */
import {registerGenerator} from '../core/registry.js';
import {Color, DesignContext, Rect} from '../core/types.js';
import {baseFill, clipped, palettePair, svgEl} from './_generator.js';

function render(ctx: DesignContext, bounds: Rect): SVGElement {
  const {rng, palette} = ctx;
  const {bg, fg} = palettePair(ctx, rng);
  const g = clipped(ctx, bounds);
  baseFill(g, bounds, bg); // bg reads as mortar

  const tones: Color[] = [fg, palette.primary, palette.accent];
  const rows = rng.int(6, 16);
  const brickH = bounds.h / rows;
  const bricksPerRow = rng.int(3, 7);
  const brickW = bounds.w / bricksPerRow;
  const mortar = Math.max(1, Math.min(brickW, brickH) * rng.range(0.04, 0.1));

  for (let r = 0; r < rows; r++) {
    const y = bounds.y + r * brickH;
    const offset = (r & 1) === 1 ? brickW / 2 : 0;
    const start = bounds.x - brickW + offset;
    const cells = bricksPerRow + 2;
    for (let c = 0; c < cells; c++) {
      const x = start + c * brickW;
      g.appendChild(
        svgEl('rect', {
          x: x + mortar / 2,
          y: y + mortar / 2,
          width: brickW - mortar,
          height: brickH - mortar,
          fill: rng.pick(tones),
        }),
      );
    }
  }
  return g;
}

registerGenerator({name: 'brick-wall', category: 'tiling', weight: 2, render});
