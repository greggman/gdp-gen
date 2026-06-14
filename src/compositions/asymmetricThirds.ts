/**
 * Asymmetric thirds: the frame is divided on the rule-of-thirds lines into
 * unequal regions. A large textured field occupies two-thirds, a narrower band
 * the remaining third, and text is anchored on a thirds intersection. The
 * deliberate imbalance is the workhorse layout of editorial and poster design.
 */
import {registerComposition} from '../core/registry.js';
import {DesignContext, Rect} from '../core/types.js';
import {splitX, splitY} from '../layout/geometry.js';
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
  const rtl = isRtl(ctx);

  // Split along a thirds line on the long axis: big field + narrow band.
  let big: Rect;
  let band: Rect;
  const bigFirst = rtl ? false : rng.chance(0.6);
  if (landscape) {
    const t = bigFirst ? 2 / 3 : 1 / 3;
    const [a, b] = splitX(ctx.bounds(), t);
    [big, band] = bigFirst ? [a, b] : [b, a];
  } else {
    const t = bigFirst ? 2 / 3 : 1 / 3;
    const [a, b] = splitY(ctx.bounds(), t);
    [big, band] = bigFirst ? [a, b] : [b, a];
  }

  ctx.fillRegion(big);
  block(ctx, band, regionFill(ctx, rng));

  const bundle = textBundle(ctx);
  if (!bundle) return;

  // Anchor text on the inner thirds intersection of the big field.
  const align = rtl ? 'end' : 'start';
  const padX = big.w * 0.06;
  const padY = big.h * 0.06;
  // Place the text block in the lower-leading third of the big field, on a
  // solid backing for contrast over the texture.
  const tw = big.w * (landscape ? 0.5 : 0.85);
  const th = big.h * (landscape ? 0.42 : 0.32);
  const tx = rtl ? big.x + big.w - padX - tw : big.x + padX;
  const ty = big.y + big.h - padY - th;
  const backing: Rect = {x: tx, y: ty, w: tw, h: th};
  block(ctx, backing, palette.background);

  const ip = Math.min(backing.w, backing.h) * 0.08;
  const inner = {x: backing.x + ip, y: backing.y + ip, w: backing.w - ip * 2, h: backing.h - ip * 2};

  drawHeadline(
    ctx,
    {x: inner.x, y: inner.y, w: inner.w, h: inner.h * 0.5},
    bundle.headline,
    textStyle(ctx, displaySize(ctx, 0.075), heavyWeight(ctx)),
    {bg: palette.background, fill: palette.primary, align},
  );

  drawHeadline(
    ctx,
    {x: inner.x, y: inner.y + inner.h * 0.52, w: inner.w, h: inner.h * 0.18},
    bundle.sub,
    textStyle(ctx, displaySize(ctx, 0.032), heavyWeight(ctx)),
    {bg: palette.background, fill: palette.accent, align},
  );

  drawParagraph(
    ctx,
    {x: inner.x, y: inner.y + inner.h * 0.74, w: inner.w, h: inner.h * 0.26},
    `${bundle.label} · ${bundle.body[0]}`,
    textStyle(ctx, displaySize(ctx, 0.019)),
    {bg: palette.background, fill: palette.text, anchor: align, lineHeight: 1.35},
  );
}

registerComposition({name: 'asymmetric-thirds', weight: 2, render});
