/**
 * Tile grid: the canvas is divided into a grid of cells, each filled by a
 * different generator. One cell may instead hold a text block on a solid color.
 * A lively contact-sheet look that shows off the generator library.
 */
import {registerComposition} from '../core/registry.js';
import {DesignContext} from '../core/types.js';
import {gridCells} from '../layout/grid.js';
import {drawHeadline} from '../typography/fitText.js';
import {
  block,
  displaySize,
  fillFocal,
  heavyWeight,
  isRtl,
  textBundle,
  textStyle,
} from './_composition.js';

function render(ctx: DesignContext): void {
  const {rng, palette} = ctx;
  const landscape = ctx.width >= ctx.height;
  const cols = landscape ? rng.int(3, 5) : rng.int(2, 3);
  const rows = landscape ? rng.int(2, 3) : rng.int(3, 5);
  const gap = rng.chance(0.5) ? Math.min(ctx.width, ctx.height) * rng.range(0.005, 0.02) : 0;
  const cells = gridCells(ctx.bounds(), cols, rows, gap);

  const bundle = textBundle(ctx);
  // Reserve one cell for text (if any). Bias toward a corner.
  const textCell = bundle ? rng.pick([0, cols - 1, cells.length - cols, cells.length - 1]) : -1;

  cells.forEach((cell, i) => {
    if (i === textCell) {
      block(ctx, cell, palette.background);
      return;
    }
    // A few cells become rendered 3D objects amongst the textures.
    fillFocal(ctx, cell, undefined, 0.2);
  });

  if (bundle && textCell >= 0) {
    const cell = cells[textCell];
    const pad = Math.min(cell.w, cell.h) * 0.08;
    drawHeadline(
      ctx,
      {x: cell.x + pad, y: cell.y + pad, w: cell.w - pad * 2, h: cell.h - pad * 2},
      bundle.headline,
      textStyle(ctx, displaySize(ctx, 0.05), heavyWeight(ctx)),
      {bg: palette.background, fill: palette.primary, align: isRtl(ctx) ? 'end' : 'start'},
    );
  }
}

registerComposition({name: 'tile-grid', weight: 2, render});
