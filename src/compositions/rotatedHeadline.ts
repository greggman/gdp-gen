/**
 * Rotated headline: a giant headline set at a strong, confident angle slashes
 * across a full-bleed generator field, backed by a solid band so it cuts
 * cleanly through the texture. Supporting lines stack at a smaller scale.
 * Diagonal energy of techno flyers and Brody-era editorial.
 */
import {registerComposition} from '../core/registry.js';
import {Color, DesignContext} from '../core/types.js';
import {drawHeadline} from '../typography/fitText.js';
import {
  block,
  displaySize,
  fillBackground,
  heavyWeight,
  isRtl,
  margin,
  regionFill,
  textBundle,
  textStyle,
} from './_composition.js';

function render(ctx: DesignContext): void {
  const {rng, palette} = ctx;
  const {width: W, height: H} = ctx;
  const fieldColor: Color = regionFill(ctx, rng);
  fillBackground(ctx, rng.chance(0.5) ? palette.background : fieldColor);

  // A full-bleed generator field is the protagonist behind the type.
  ctx.fillRegion(ctx.bounds());

  const bundle = textBundle(ctx);
  if (!bundle) {
    // No text: rotated bold bars give the diagonal rhythm.
    const cx = W / 2;
    const cy = H / 2;
    const ang = rng.range(-32, -18) * (rng.chance(0.5) ? 1 : -1);
    const g = ctx.group();
    g.setAttribute('transform', `rotate(${ang.toFixed(2)} ${cx} ${cy})`);
    const span = Math.hypot(W, H);
    const bars = rng.int(3, 6);
    for (let i = 0; i < bars; i++) {
      const h = H * rng.range(0.04, 0.12);
      const y = cy - span / 2 + (span / bars) * (i + rng.range(0.1, 0.5));
      block(
        ctx,
        {x: cx - span / 2, y, w: span, h},
        i % 2 ? palette.accent : palette.primary,
        g,
      );
    }
    return;
  }

  const rtl = isRtl(ctx);
  // A strong, committed angle -- never a timid tilt.
  const sign = rng.chance(0.5) ? 1 : -1;
  const angle = rng.range(18, 34) * sign;
  const cx = W * rng.range(0.42, 0.58);
  const cy = H * rng.range(0.4, 0.6);

  const g = ctx.group();
  g.setAttribute('transform', `rotate(${angle.toFixed(3)} ${cx} ${cy})`);

  // Giant headline crossing the canvas, bleeding off both ends, on a solid
  // backing band drawn by drawHeadline for guaranteed contrast over texture.
  const bandColor = rng.chance(0.5) ? palette.primary : palette.accent;
  const m = margin(ctx, 0.03);
  const headStyle = textStyle(ctx, displaySize(ctx, rng.range(0.16, 0.24)), heavyWeight(ctx));
  drawHeadline(
    ctx,
    {x: cx - W * 0.7, y: cy - H * 0.1, w: W * 1.4, h: H * 0.2},
    bundle.headline,
    headStyle,
    {
      mode: 'bleed',
      backing: true,
      bg: bandColor,
      align: 'middle',
      parent: g,
    },
  );

  // A second, smaller rotated band for the sub, offset below the headline.
  const subColor = bandColor === palette.primary ? palette.accent : palette.primary;
  drawHeadline(
    ctx,
    {x: cx - W * 0.5, y: cy + H * 0.13, w: W, h: H * 0.09},
    bundle.sub,
    textStyle(ctx, displaySize(ctx, rng.range(0.06, 0.09)), heavyWeight(ctx)),
    {
      mode: 'bleed',
      backing: true,
      bg: subColor,
      align: 'middle',
      parent: g,
    },
  );

  // Axis-aligned corner label anchors the spinning type to the grid.
  const labelStyle = textStyle(ctx, displaySize(ctx, 0.026), heavyWeight(ctx));
  const labelBg = palette.background;
  block(
    ctx,
    {x: 0, y: H - displaySize(ctx, 0.07), w: W, h: displaySize(ctx, 0.07)},
    labelBg,
  );
  drawHeadline(
    ctx,
    {x: m * 2, y: H - displaySize(ctx, 0.065), w: W - m * 4, h: displaySize(ctx, 0.06)},
    `${bundle.label} · ${bundle.body[0] ?? bundle.sub}`,
    labelStyle,
    {bg: labelBg, fill: palette.text, minContrast: 4.5, align: rtl ? 'end' : 'start'},
  );
}

registerComposition({name: 'rotated-headline', weight: 3, render});
