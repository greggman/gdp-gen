/**
 * Full-bleed generator: one pattern fills the entire canvas. If the design has
 * text, a headline is set over a solid backing band so it stays readable no
 * matter what texture lies behind it. The natural home for text-less designs.
 */
import {registerComposition} from '../core/registry.js';
import {DesignContext} from '../core/types.js';
import {drawHeadline} from '../typography/fitText.js';
import {
  displaySize,
  heavyWeight,
  isRtl,
  margin,
  textBundle,
  textStyle,
} from './_composition.js';

function render(ctx: DesignContext): void {
  const {rng, palette} = ctx;
  ctx.fillRegion(ctx.bounds());

  const bundle = textBundle(ctx);
  if (!bundle) return; // Pure-pattern design.

  const m = margin(ctx, 0.07);
  const align = isRtl(ctx) ? 'end' : rng.pick(['start', 'middle'] as const);
  const bandColor = rng.chance(0.5) ? palette.background : palette.primary;
  const y = ctx.height * rng.range(0.3, 0.6);

  // Backing band guarantees contrast over the texture.
  drawHeadline(
    ctx,
    {x: m, y, w: ctx.width - m * 2, h: ctx.height * 0.16},
    bundle.headline,
    textStyle(ctx, displaySize(ctx, rng.range(0.1, 0.16)), heavyWeight(ctx)),
    {mode: 'bleed', backing: true, bg: bandColor, align},
  );

  drawHeadline(
    ctx,
    {x: m, y: y + ctx.height * 0.16, w: ctx.width - m * 2, h: ctx.height * 0.07},
    `${bundle.sub} · ${bundle.label}`,
    textStyle(ctx, displaySize(ctx, 0.035), heavyWeight(ctx)),
    {mode: 'bleed', backing: true, bg: bandColor, align},
  );
}

registerComposition({name: 'full-bleed', weight: 3, render});
