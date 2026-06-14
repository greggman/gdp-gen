/**
 * Vertical columns: the frame is sliced into tall parallel columns, each filled
 * with a generator texture or a solid band. One column is reserved as a solid
 * panel for vertically-stacked display text rotated to run up the column. Evokes
 * banner stands, kanji-style posters, and gridded album spines.
 */
import {registerComposition} from '../core/registry.js';
import {DesignContext, Rect} from '../core/types.js';
import {columns} from '../layout/geometry.js';
import {drawHeadline} from '../typography/fitText.js';
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

  const n = ctx.width >= ctx.height ? rng.int(5, 8) : rng.int(3, 5);
  const gap = ctx.width * rng.range(0.004, 0.012);
  const cols = columns(ctx.bounds(), n, gap);

  const bundle = textBundle(ctx);
  // Reserve a column for text: leading edge for the script direction.
  const rtl = isRtl(ctx);
  const textCol = bundle ? (rtl ? n - 1 : 0) : -1;

  cols.forEach((col, i) => {
    if (i === textCol) {
      block(ctx, col, palette.background);
      return;
    }
    if (rng.chance(0.6)) {
      ctx.fillRegion(col);
    } else {
      block(ctx, col, regionFill(ctx, rng));
    }
  });

  if (!bundle || textCol < 0) return;

  const col = cols[textCol];
  // Rotate the headline to run vertically up the column.
  const g = ctx.group();
  const cx = col.x + col.w / 2;
  const cy = col.y + col.h / 2;
  g.setAttribute('transform', `rotate(-90 ${cx} ${cy})`);

  // After rotation, width<->height swap: lay the headline across the column's
  // height, centered on its center.
  const rect: Rect = {x: cx - col.h / 2, y: cy - col.w / 2, w: col.h, h: col.w};
  const pad = col.h * 0.04;
  drawHeadline(
    ctx,
    {x: rect.x + pad, y: rect.y, w: rect.w - pad * 2, h: rect.h * 0.6},
    bundle.headline,
    textStyle(ctx, col.w * 0.4, heavyWeight(ctx)),
    {bg: palette.background, fill: palette.primary, align: 'middle', parent: g},
  );

  drawHeadline(
    ctx,
    {x: rect.x + pad, y: rect.y + rect.h * 0.62, w: rect.w - pad * 2, h: rect.h * 0.3},
    `${bundle.sub} · ${bundle.label}`,
    textStyle(ctx, col.w * 0.16, heavyWeight(ctx)),
    {bg: palette.background, fill: palette.accent, align: 'middle', parent: g},
  );
}

registerComposition({name: 'vertical-columns', weight: 2, render});
