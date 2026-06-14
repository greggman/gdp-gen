/**
 * Modular grid: a strict, even grid of cells. Some cells carry generator
 * textures, some carry solid color blocks, and a contiguous run of cells is
 * merged into a single panel that holds the text. The disciplined repetition
 * recalls grid-system museum catalogs and techno record sleeves.
 */
import {registerComposition} from '../core/registry.js';
import {DesignContext, Rect} from '../core/types.js';
import {gridCells} from '../layout/grid.js';
import {drawHeadline, drawParagraph} from '../typography/fitText.js';
import {
  block,
  displaySize,
  fillBackground,
  heavyWeight,
  isRtl,
  regionFill,
  textBundle,
  textStyle,
} from './_composition.js';

function render(ctx: DesignContext): void {
  const {rng, palette} = ctx;
  fillBackground(ctx);

  const landscape = ctx.width >= ctx.height;
  const cols = landscape ? rng.int(4, 6) : rng.int(3, 4);
  const rowCount = landscape ? rng.int(3, 4) : rng.int(4, 6);
  const gap = Math.min(ctx.width, ctx.height) * rng.range(0.008, 0.02);
  const cells = gridCells(ctx.bounds(), cols, rowCount, gap);

  const bundle = textBundle(ctx);

  // Choose a rectangular block of cells to merge for the text panel.
  let textPanel: Rect | null = null;
  const skip = new Set<number>();
  if (bundle) {
    const spanCols = Math.min(cols, rng.int(2, 3));
    const spanRows = Math.min(rowCount, rng.int(1, 2));
    const startCol = rng.int(0, cols - spanCols);
    const startRow = rng.int(0, rowCount - spanRows);
    const tl = cells[startRow * cols + startCol];
    const br = cells[(startRow + spanRows - 1) * cols + (startCol + spanCols - 1)];
    textPanel = {x: tl.x, y: tl.y, w: br.x + br.w - tl.x, h: br.y + br.h - tl.y};
    for (let r = startRow; r < startRow + spanRows; r++) {
      for (let c = startCol; c < startCol + spanCols; c++) skip.add(r * cols + c);
    }
  }

  cells.forEach((cell, i) => {
    if (skip.has(i)) return;
    // Mix of textures and solid color cells for rhythm.
    if (rng.chance(0.55)) {
      ctx.fillRegion(cell);
    } else {
      block(ctx, cell, regionFill(ctx, rng));
    }
  });

  if (!bundle || !textPanel) return;

  block(ctx, textPanel, palette.background);
  const pad = Math.min(textPanel.w, textPanel.h) * 0.1;
  const inner = {
    x: textPanel.x + pad,
    y: textPanel.y + pad,
    w: textPanel.w - pad * 2,
    h: textPanel.h - pad * 2,
  };
  const align = isRtl(ctx) ? 'end' : 'start';

  drawHeadline(
    ctx,
    {x: inner.x, y: inner.y, w: inner.w, h: inner.h * 0.6},
    bundle.headline,
    textStyle(ctx, displaySize(ctx, 0.06), heavyWeight(ctx)),
    {bg: palette.background, fill: palette.primary, align},
  );

  drawParagraph(
    ctx,
    {x: inner.x, y: inner.y + inner.h * 0.62, w: inner.w, h: inner.h * 0.38},
    `${bundle.sub} · ${bundle.label}`,
    textStyle(ctx, displaySize(ctx, 0.022)),
    {bg: palette.background, fill: palette.text, anchor: align},
  );
}

registerComposition({name: 'modular-grid', weight: 2, render});
