/**
 * Exploded grid: a tight modular grid of generator-filled cells and flat color
 * planes -- then ONE cell breaks the grid, exploding into a giant element that
 * spans several cells and carries the headline. Swiss grid discipline shattered
 * by a single oversized intrusion. Extreme scale contrast, tension, asymmetry.
 */
import {registerComposition} from '../core/registry.js';
import {Color, DesignContext, Rect} from '../core/types.js';
import {gridCells} from '../layout/grid.js';
import {drawHeadline, drawLine} from '../typography/fitText.js';
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
  const {width: W, height: H} = ctx;
  fillBackground(ctx, palette.background);

  const landscape = W >= H;
  const cols = landscape ? rng.int(4, 6) : rng.int(3, 4);
  const rows = landscape ? rng.int(3, 4) : rng.int(4, 6);
  const gap = Math.min(W, H) * rng.range(0.006, 0.018);
  const cells = gridCells(ctx.bounds(), cols, rows, gap);

  // Choose the explosion: a block of bw x bh cells, anchored off-centre, that
  // will be merged into one giant rect.
  const bw = Math.min(cols - 1, rng.int(2, Math.max(2, cols - 1)));
  const bh = Math.min(rows - 1, rng.int(2, Math.max(2, rows - 1)));
  const startCol = rng.int(0, cols - bw);
  const startRow = rng.int(0, rows - bh);

  // Mark which cells are swallowed by the explosion.
  const swallowed = new Set<number>();
  for (let r = startRow; r < startRow + bh; r++) {
    for (let c = startCol; c < startCol + bw; c++) {
      swallowed.add(r * cols + c);
    }
  }

  // Fill the remaining (small) cells: mostly generator textures, some flat planes
  // of accent/primary for bold color blocking.
  cells.forEach((cell, i) => {
    if (swallowed.has(i)) return;
    if (rng.chance(0.32)) {
      block(ctx, cell, rng.chance(0.5) ? palette.primary : palette.accent);
    } else {
      ctx.fillRegion(cell);
    }
  });

  // Compute the merged explosion rect from its corner cells.
  const tl = cells[startRow * cols + startCol];
  const br = cells[(startRow + bh - 1) * cols + (startCol + bw - 1)];
  const boom: Rect = {x: tl.x, y: tl.y, w: br.x + br.w - tl.x, h: br.y + br.h - tl.y};

  const bundle = textBundle(ctx);

  // The exploded cell is the protagonist: a solid plate (so type stays readable)
  // sitting over the grid, scaled far beyond its neighbors.
  const plateColor: Color = bundle
    ? rng.weighted([palette.primary, palette.accent, palette.background], [3, 3, 2])
    : regionFill(ctx, rng);

  if (!bundle) {
    // No text: the explosion is a full generator slab -- a loud focal texture.
    ctx.fillRegion(boom);
    return;
  }

  block(ctx, boom, plateColor);
  const rtl = isRtl(ctx);
  const pad = Math.min(boom.w, boom.h) * 0.08;
  const inner: Rect = {x: boom.x + pad, y: boom.y + pad, w: boom.w - pad * 2, h: boom.h - pad * 2};

  // Giant headline filling the exploded cell, bleeding past its edges for energy.
  const headSize = Math.min(inner.h * 0.62, displaySize(ctx, rng.range(0.16, 0.26)));
  drawHeadline(
    ctx,
    {x: inner.x, y: inner.y, w: inner.w, h: inner.h * 0.66},
    bundle.headline,
    textStyle(ctx, headSize, heavyWeight(ctx)),
    {mode: 'bleed', backing: false, bg: plateColor, align: rtl ? 'end' : 'start', minContrast: 3},
  );

  // A coordinate-style sub line anchors the explosion to the grid logic.
  const subSize = displaySize(ctx, 0.026);
  drawLine(
    ctx,
    rtl ? inner.x + inner.w : inner.x,
    inner.y + inner.h - subSize * 0.2,
    `${bundle.sub} · ${bundle.label}`,
    textStyle(ctx, subSize, heavyWeight(ctx)),
    {bg: plateColor, fill: palette.text, minContrast: 4.5, anchor: rtl ? 'end' : 'start'},
  );
}

registerComposition({name: 'exploded-grid', weight: 2, render});
