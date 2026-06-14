/**
 * Corner-anchored: all the text is pinned into one corner of the frame, leaving
 * a large field of negative space. A single textured block or accent shape sits
 * in the opposite corner to balance the void. The deliberate emptiness is a
 * staple of contemporary art-museum and fashion posters.
 */
import {registerComposition} from '../core/registry.js';
import {DesignContext, Rect} from '../core/types.js';
import {drawHeadline, drawParagraph} from '../typography/fitText.js';
import {
  block,
  displaySize,
  fillBackground,
  heavyWeight,
  isRtl,
  margin,
  textBundle,
  textStyle,
} from './_composition.js';

function render(ctx: DesignContext): void {
  const {rng, palette} = ctx;
  fillBackground(ctx);

  const rtl = isRtl(ctx);
  const m = margin(ctx, 0.07);

  // RTL designs anchor to the right; LTR to the left. Choose top or bottom.
  const right = rtl ? true : rng.chance(0.5);
  const bottom = rng.chance(0.5);
  const align = right ? 'end' : 'start';

  const bundle = textBundle(ctx);
  if (!bundle) {
    // No text: a large texture field dominates from the anchored side, leaving a
    // deliberate corner of negative space -- the emptiness reads as intent.
    const bw = ctx.width * rng.range(0.62, 0.8);
    const bh = ctx.height * rng.range(0.6, 0.82);
    ctx.fillRegion({
      x: right ? ctx.width - m - bw : m,
      y: bottom ? ctx.height - m - bh : m,
      w: bw,
      h: bh,
    });
    return;
  }

  const blockW = Math.min(ctx.width, ctx.height) * rng.range(0.28, 0.42);
  const blockH = blockW;
  // Counterweight block in the OPPOSITE corner.
  const counter: Rect = {
    x: right ? m : ctx.width - m - blockW,
    y: bottom ? m : ctx.height - m - blockH,
    w: blockW,
    h: blockH,
  };
  ctx.fillRegion(counter);

  const colW = Math.min(ctx.width - m * 2, ctx.width * rng.range(0.45, 0.6));
  const colX = right ? ctx.width - m - colW : m;
  // Stack the text against the anchored corner's vertical edge.
  const headH = ctx.height * 0.26;
  const headY = bottom ? ctx.height - m - headH : m;

  drawHeadline(
    ctx,
    {x: colX, y: headY, w: colW, h: headH * 0.6},
    bundle.headline,
    textStyle(ctx, displaySize(ctx, 0.11), heavyWeight(ctx)),
    {bg: palette.background, fill: palette.primary, align},
  );

  drawHeadline(
    ctx,
    {x: colX, y: headY + headH * 0.62, w: colW, h: headH * 0.2},
    bundle.sub,
    textStyle(ctx, displaySize(ctx, 0.04), heavyWeight(ctx)),
    {bg: palette.background, fill: palette.accent, align},
  );

  drawParagraph(
    ctx,
    {x: colX, y: headY + headH * 0.88, w: colW, h: ctx.height * 0.16},
    `${bundle.label} · ${bundle.english ?? bundle.body[0]}`,
    textStyle(ctx, displaySize(ctx, 0.02)),
    {bg: palette.background, fill: palette.text, anchor: align, lineHeight: 1.4},
  );
}

registerComposition({name: 'corner-anchored', weight: 2, render});
