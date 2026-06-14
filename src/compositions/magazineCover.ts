/**
 * Magazine cover: a bold masthead band across the top, a full-bleed generator
 * texture as the "photo", and a stack of cover lines down one edge. Evokes the
 * grid of a newsstand fashion or culture magazine.
 */
import {registerComposition} from '../core/registry.js';
import {DesignContext} from '../core/types.js';
import {inset, splitY} from '../layout/geometry.js';
import {drawHeadline} from '../typography/fitText.js';
import {
  block,
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
  const align = rtl ? 'end' : 'start';
  // Masthead band at the very top; the rest is the "cover image" texture.
  const [masthead, lower] = splitY(ctx.bounds(), rng.range(0.14, 0.2));
  ctx.fillRegion(lower);

  const bundle = textBundle(ctx);
  if (!bundle) {
    // No text: emphasize the masthead band as a solid color stripe.
    block(ctx, masthead, palette.accent);
    return;
  }

  // Masthead: a solid color bar with the headline reversed out of it.
  block(ctx, masthead, palette.primary);
  const mPad = masthead.h * 0.18;
  drawHeadline(
    ctx,
    inset(masthead, mPad),
    bundle.headline,
    textStyle(ctx, masthead.h * 0.7, heavyWeight(ctx)),
    {bg: palette.primary, fill: palette.background, align: 'middle'},
  );

  // Cover lines: small backed blocks down the leading edge over the texture.
  const m = margin(ctx, 0.05);
  const colW = lower.w * rng.range(0.34, 0.46);
  const colX = rtl ? lower.x + lower.w - m - colW : lower.x + m;
  const lines = [bundle.sub, ...bundle.body].slice(0, 4);
  let y = lower.y + m;
  const lineH = lower.h * 0.13;
  for (const line of lines) {
    const lh = lineH * rng.range(0.85, 1);
    const lw = colW * rng.range(0.7, 1);
    const lx = rtl ? colX + colW - lw : colX;
    block(ctx, {x: lx, y, w: lw, h: lh}, palette.background);
    drawHeadline(
      ctx,
      inset({x: lx, y, w: lw, h: lh}, lh * 0.16),
      line,
      textStyle(ctx, lh * 0.5, heavyWeight(ctx)),
      {bg: palette.background, fill: palette.primary, align},
    );
    y += lh + m * 0.5;
  }

  // Issue label as a footer strip reversed out of an accent bar.
  const labelH = lower.h * 0.09;
  const footer = {x: lower.x, y: lower.y + lower.h - labelH, w: lower.w, h: labelH};
  block(ctx, footer, palette.accent);
  drawHeadline(
    ctx,
    inset(footer, m * 0.5, labelH * 0.18),
    `${bundle.label} · ${bundle.english ?? bundle.sub}`,
    textStyle(ctx, labelH * 0.45, heavyWeight(ctx)),
    {bg: palette.accent, fill: palette.background, align},
  );
}

registerComposition({name: 'magazine-cover', weight: 2, render});
