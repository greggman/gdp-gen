/**
 * Vertical megatype: a single gigantic headline set on its side and scaled to
 * span the full height of the canvas, dominating the page as one enormous
 * confident element. A wide generator band runs alongside it and a small label
 * sits at the foot, keeping the negative space an active, asymmetric shape.
 * Spine-of-a-monolith scale -- exhibition banner / kanji-poster energy.
 */
import {registerComposition} from '../core/registry.js';
import {Color, DesignContext, Rect} from '../core/types.js';
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
  const bgIsColor = rng.chance(0.45);
  const bg: Color = bgIsColor ? fieldColor : palette.background;
  fillBackground(ctx, bg);

  const bundle = textBundle(ctx);
  if (!bundle) {
    // No text: a tall full-height generator slab as the lone monolith, pushed
    // off-centre with a bold flat plane filling the remainder.
    const slabW = W * rng.range(0.4, 0.6);
    const slabX = rng.chance(0.5) ? 0 : W - slabW;
    ctx.fillRegion({x: slabX, y: 0, w: slabW, h: H});
    block(ctx, {x: slabX === 0 ? slabW : 0, y: H * rng.range(0.3, 0.6), w: W - slabW, h: H * 0.12}, palette.accent);
    return;
  }

  const rtl = isRtl(ctx);

  // The megatype column occupies a large vertical strip pushed to one side; a
  // wide generator band fills the rest so the texture is a full protagonist.
  const colFrac = rng.range(0.5, 0.66);
  const colW = W * colFrac;
  // Place the type column on the leading edge for the script direction.
  const colLeft = rtl;
  const colX = colLeft ? 0 : W - colW;
  const bandX = colLeft ? colW : 0;
  const bandW = W - colW;

  // Wide generator band running the full height alongside the type.
  ctx.fillRegion({x: bandX, y: 0, w: bandW, h: H});

  // Solid plate behind the type column for guaranteed contrast.
  const plateColor: Color = bgIsColor ? palette.background : fieldColor;
  block(ctx, {x: colX, y: 0, w: colW, h: H}, plateColor);

  // Rotate the headline -90deg so it runs up the full height of the column.
  const g = ctx.group();
  const cx = colX + colW / 2;
  const cy = H / 2;
  g.setAttribute('transform', `rotate(-90 ${cx} ${cy})`);

  // After rotation, the drawing rect spans the canvas HEIGHT as its width.
  const m = margin(ctx, 0.04);
  // Headline sized to fill ~full height: bleed mode lets it run edge to edge.
  const headSize = colW * rng.range(0.62, 0.82);
  const headRect: Rect = {
    x: cx - H / 2 + m,
    y: cy - colW * 0.32,
    w: H - m * 2,
    h: colW * 0.7,
  };
  drawHeadline(ctx, headRect, bundle.headline, textStyle(ctx, headSize, heavyWeight(ctx)), {
    mode: 'bleed',
    backing: false,
    bg: plateColor,
    align: 'middle',
    minContrast: 4.5,
    parent: g,
  });

  // Small upright label at the foot of the band side -- active negative space.
  const labelH = displaySize(ctx, 0.05);
  const labelBg: Color = palette.primary;
  const labelRect: Rect = {x: bandX, y: H - labelH, w: bandW, h: labelH};
  block(ctx, labelRect, labelBg);
  drawHeadline(
    ctx,
    {x: labelRect.x + m, y: labelRect.y, w: labelRect.w - m * 2, h: labelH},
    `${bundle.sub} · ${bundle.label}`,
    textStyle(ctx, labelH * 0.42, heavyWeight(ctx)),
    {bg: labelBg, fill: palette.background, minContrast: 4.5, align: rtl ? 'end' : 'start'},
  );
}

registerComposition({name: 'vertical-megatype', weight: 2, render});
