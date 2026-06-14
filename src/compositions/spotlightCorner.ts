/**
 * Spotlight corner: a radial generator burst (sunburst / rays / concentric
 * rings) anchored on ONE corner, its center pinned to the corner so the rays
 * fan out diagonally across most of the canvas. The headline emerges from the
 * burst, reversed out of a bold backing wedge, with supporting type tucked into
 * the calm opposite corner. Extreme scale + diagonal energy + generator as
 * protagonist.
 */
import {registerComposition} from '../core/registry.js';
import {Color, DesignContext, Rect} from '../core/types.js';
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

const BURSTS = ['sunburst', 'rayGradient', 'radialLines', 'starburstThin', 'radialGradient', 'radialDots'];

type Corner = 'tl' | 'tr' | 'bl' | 'br';

function render(ctx: DesignContext): void {
  const {rng, palette} = ctx;
  const burstBg: Color = rng.chance(0.5) ? palette.primary : palette.background;
  fillBackground(ctx, burstBg);

  const corner = rng.pick(['tl', 'tr', 'bl', 'br'] as const) as Corner;
  const cx = corner === 'tl' || corner === 'bl' ? 0 : ctx.width;
  const cy = corner === 'tl' || corner === 'tr' ? 0 : ctx.height;

  // A big square centered ON the corner so the generator's center pins there and
  // the burst reaches well past the diagonal -- covering most of the canvas.
  const reach = Math.hypot(ctx.width, ctx.height) * rng.range(1.3, 1.7);
  const region: Rect = {x: cx - reach, y: cy - reach, w: reach * 2, h: reach * 2};

  // Clip the burst to the canvas so off-canvas geometry doesn't bloat the doc.
  const cid = `sc${rng.int(0, 1e7).toString(36)}`;
  const defs = ctx.el('defs');
  const clip = ctx.el('clipPath', {id: cid});
  clip.appendChild(ctx.el('rect', {x: 0, y: 0, width: ctx.width, height: ctx.height}));
  defs.appendChild(clip);
  ctx.root.appendChild(defs);
  const burstG = ctx.group();
  burstG.setAttribute('clip-path', `url(#${cid})`);
  ctx.root.appendChild(burstG);
  ctx.fillRegion(region, burstG, rng.pick(BURSTS));

  const bundle = textBundle(ctx);
  if (!bundle) return;

  const rtl = isRtl(ctx);
  const m = margin(ctx, 0.06);
  const weight = heavyWeight(ctx);

  // Headline emerges along the diagonal away from the corner, reversed out of a
  // bold wedge backing so it stays legible over the rays.
  const near = corner === 'tl' || corner === 'tr';
  const headBg: Color = rng.chance(0.5) ? palette.accent : palette.text;
  const headRect: Rect = {
    x: m,
    y: near ? ctx.height * 0.18 : ctx.height * 0.5,
    w: ctx.width - m * 2,
    h: ctx.height * 0.32,
  };
  const align =
    corner === 'tr' || corner === 'br' ? (rtl ? 'start' : 'end') : rtl ? 'end' : 'start';
  drawHeadline(
    ctx,
    headRect,
    bundle.headline,
    textStyle(ctx, displaySize(ctx, rng.range(0.16, 0.24)), weight),
    {mode: 'bleed', backing: true, bg: headBg, fill: palette.background, align},
  );

  // Supporting type stacked into the calm OPPOSITE corner.
  const oppRight = corner === 'tl' || corner === 'bl';
  const oppBottom = corner === 'tl' || corner === 'tr';
  const subW = ctx.width * 0.46;
  const subX = oppRight ? ctx.width - m - subW : m;
  const subY = oppBottom ? ctx.height - m - ctx.height * 0.2 : m;
  const subAlign = oppRight ? (rtl ? 'start' : 'end') : rtl ? 'end' : 'start';

  // A small solid backing chip so supporting text sits on a known color.
  const chipBg = palette.background;
  const chip: Rect = {x: subX - m * 0.4, y: subY - m * 0.4, w: subW + m * 0.8, h: ctx.height * 0.22 + m * 0.8};
  block(ctx, {x: Math.max(0, chip.x), y: Math.max(0, chip.y), w: chip.w, h: chip.h}, chipBg);
  drawHeadline(
    ctx,
    {x: subX, y: subY, w: subW, h: ctx.height * 0.08},
    bundle.sub,
    textStyle(ctx, displaySize(ctx, 0.04), weight),
    {bg: chipBg, fill: palette.primary, align: subAlign},
  );
  drawParagraph(
    ctx,
    {x: subX, y: subY + ctx.height * 0.09, w: subW, h: ctx.height * 0.12},
    `${bundle.body[0] ?? bundle.label}  ·  ${bundle.label}`,
    textStyle(ctx, displaySize(ctx, 0.018)),
    {bg: chipBg, fill: palette.text, anchor: subAlign},
  );
}

registerComposition({name: 'spotlight-corner', weight: 2, render});
