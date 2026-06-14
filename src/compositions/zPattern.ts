/**
 * Z-pattern: the eye's Z scan-path rebuilt as a bold poster. Two heavy bands
 * (top and bottom) anchor the Z's horizontals, a wide rotated band slashes the
 * diagonal between them, and the nodes carry an enormous headline and a giant
 * numeral/label. Generator texture fills a large field so the Z is implied by
 * massed weight, not a thin slash. Mirrored for RTL.
 */
import {registerComposition} from '../core/registry.js';
import {Color, DesignContext, Rect} from '../core/types.js';
import {inset, splitY} from '../layout/geometry.js';
import {drawHeadline, drawLine, drawParagraph} from '../typography/fitText.js';
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

/** A wide rotated band connecting two opposite corners (the Z diagonal). */
function diagonalBand(
  ctx: DesignContext,
  from: {x: number; y: number},
  to: {x: number; y: number},
  thickness: number,
  fill: Color,
): SVGGElement {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.hypot(dx, dy);
  const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
  const g = ctx.group();
  g.setAttribute('transform', `rotate(${angle} ${from.x} ${from.y})`);
  // Overshoot the length so the band bleeds past both nodes.
  block(
    ctx,
    {x: from.x - len * 0.15, y: from.y - thickness / 2, w: len * 1.3, h: thickness},
    fill,
    g,
  );
  return g;
}

function render(ctx: DesignContext): void {
  const {rng, palette} = ctx;
  const dark = palette.backgroundIsDark;
  fillBackground(ctx);

  const rtl = isRtl(ctx);
  const full = ctx.bounds();
  const W = ctx.width;
  const H = ctx.height;

  // The Z's two horizontals as big bands; diagonal between their inner corners.
  const [topBand, rest] = splitY(full, rng.range(0.3, 0.4));
  const botBandH = H * rng.range(0.18, 0.26);
  const botBand: Rect = {x: 0, y: H - botBandH, w: W, h: botBandH};

  // Leading/trailing X (mirror for RTL).
  const leadX = rtl ? W : 0;
  const trailX = rtl ? 0 : W;
  const startAlign = rtl ? 'end' : 'start';
  const endAlign = rtl ? 'start' : 'end';

  // Diagonal runs from the top band's trailing inner corner to the bottom
  // band's leading inner corner -- the Z's stroke as a fat rotated plane.
  const diagThick = Math.min(W, H) * rng.range(0.07, 0.11);
  const accent = regionFill(ctx, rng);
  diagonalBand(
    ctx,
    {x: trailX, y: topBand.y + topBand.h * 0.5},
    {x: leadX, y: botBand.y + botBand.h * 0.5},
    diagThick,
    accent,
  );

  // Top node: a large generator texture field spanning the trailing two-thirds
  // of the top band (generator as protagonist).
  const texW = topBand.w * rng.range(0.55, 0.72);
  const texX = rtl ? 0 : W - texW;
  ctx.fillRegion({x: texX, y: topBand.y, w: texW, h: topBand.h});

  // Bottom band: a solid plane (the foot of the Z).
  block(ctx, botBand, palette.primary);

  const bundle = textBundle(ctx);
  if (!bundle) {
    // No text: a second giant texture field at the leading bottom-mid carries
    // the eye down the Z, plus a heavy reversed bar across the foot.
    const bw = W * rng.range(0.42, 0.56);
    const bh = (botBand.y - topBand.h) * rng.range(0.7, 0.95);
    const bx = rtl ? W - bw : 0;
    ctx.fillRegion({x: bx, y: topBand.y + topBand.h + (botBand.y - topBand.h - bh) * 0.5, w: bw, h: bh});
    block(
      ctx,
      {x: rtl ? botBand.x : W - W * 0.3, y: botBand.y, w: W * 0.3, h: botBand.h},
      accent,
    );
    return;
  }

  const weight = heavyWeight(ctx);
  const m = Math.min(W, H) * 0.05;

  // 1. TOP-LEADING node: enormous headline bleeding across the top band, on a
  // solid backing for guaranteed contrast over the texture/diagonal.
  drawHeadline(
    ctx,
    {x: rtl ? texX - m : m, y: topBand.y + topBand.h * 0.12, w: topBand.w * 0.6, h: topBand.h * 0.62},
    bundle.headline,
    textStyle(ctx, displaySize(ctx, rng.range(0.16, 0.22)), weight),
    {
      mode: 'bleed',
      backing: true,
      bg: palette.background,
      fill: palette.primary,
      align: startAlign,
    },
  );

  // Small label tucked under the headline (extreme scale contrast).
  drawLine(
    ctx,
    rtl ? texX - m : m,
    topBand.y + topBand.h * 0.92,
    `${bundle.sub} · ${bundle.label}`,
    textStyle(ctx, displaySize(ctx, 0.022), weight),
    {bg: palette.background, fill: palette.text, anchor: startAlign},
  );

  // 2. MID node: body copy riding the diagonal, on its own solid backing block
  // so it reads over the rotated band and texture.
  const midBand: Rect = {x: 0, y: topBand.y + topBand.h, w: W, h: botBand.y - (topBand.y + topBand.h)};
  const copyW = midBand.w * 0.42;
  const copyX = rtl ? midBand.x + m : midBand.x + midBand.w - copyW - m;
  const copyRect: Rect = {
    x: copyX,
    y: midBand.y + midBand.h * 0.18,
    w: copyW,
    h: midBand.h * 0.64,
  };
  block(ctx, inset(copyRect, -m * 0.4), palette.background);
  drawParagraph(
    ctx,
    copyRect,
    bundle.body.join('  '),
    textStyle(ctx, displaySize(ctx, 0.02)),
    {bg: palette.background, fill: palette.text, anchor: rtl ? 'end' : 'start', lineHeight: 1.4},
  );

  // 3. BOTTOM-TRAILING node: the call to action, reversed huge out of the foot
  // band -- the terminal beat of the Z.
  const cta = `${bundle.english ?? bundle.sub} ${bundle.label}`;
  drawHeadline(
    ctx,
    {x: botBand.x + m, y: botBand.y + botBand.h * 0.12, w: botBand.w - m * 2, h: botBand.h * 0.76},
    cta,
    textStyle(ctx, displaySize(ctx, 0.07), weight),
    {bg: palette.primary, fill: palette.background, align: endAlign},
  );
}

registerComposition({name: 'z-pattern', weight: 2, render});
