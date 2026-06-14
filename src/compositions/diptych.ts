/**
 * Diptych: two contrasting panels split down the long axis. One panel carries a
 * generator texture, the other a solid color field holding the type. The two
 * sides answer each other -- light/dark, image/word. Inspired by paired poster
 * spreads and album gatefolds.
 */
import {registerComposition} from '../core/registry.js';
import {DesignContext} from '../core/types.js';
import {inset, splitX, splitY} from '../layout/geometry.js';
import {drawHeadline, drawParagraph} from '../typography/fitText.js';
import {
  block,
  displaySize,
  fillBackground,
  heavyWeight,
  isRtl,
  textBundle,
  textStyle,
} from './_composition.js';

function render(ctx: DesignContext): void {
  const {rng, palette} = ctx;
  fillBackground(ctx);

  const landscape = ctx.width >= ctx.height;
  const t = rng.range(0.42, 0.58);
  // Split along the long axis so each panel reads as a full half.
  const [first, second] = landscape ? splitX(ctx.bounds(), t) : splitY(ctx.bounds(), t);

  const rtl = isRtl(ctx);
  // The text panel is solid; the other panel is texture.
  const textFirst = rtl ? !landscape : rng.chance(0.5);
  const textPanel = textFirst ? first : second;
  const texPanel = textFirst ? second : first;
  const panelColor = rng.chance(0.5) ? palette.primary : palette.accent;

  ctx.fillRegion(texPanel);
  block(ctx, textPanel, panelColor);

  const bundle = textBundle(ctx);
  if (!bundle) {
    // No text: a contrasting solid vs texture diptych is already complete.
    return;
  }

  const align = rtl ? 'end' : 'start';
  const pad = Math.min(textPanel.w, textPanel.h) * 0.1;
  const inner = inset(textPanel, pad);

  // Headline dominates the upper part of the text panel.
  drawHeadline(
    ctx,
    {x: inner.x, y: inner.y, w: inner.w, h: inner.h * 0.4},
    bundle.headline,
    textStyle(ctx, displaySize(ctx, rng.range(0.08, 0.13)), heavyWeight(ctx)),
    {bg: panelColor, fill: palette.background, align},
  );

  // Subtitle.
  drawHeadline(
    ctx,
    {x: inner.x, y: inner.y + inner.h * 0.44, w: inner.w, h: inner.h * 0.1},
    bundle.sub,
    textStyle(ctx, displaySize(ctx, 0.035), heavyWeight(ctx)),
    {bg: panelColor, fill: palette.background, align},
  );

  // Body copy fills the lower part.
  drawParagraph(
    ctx,
    {x: inner.x, y: inner.y + inner.h * 0.58, w: inner.w, h: inner.h * 0.34},
    bundle.body.join('  '),
    textStyle(ctx, displaySize(ctx, 0.02)),
    {bg: panelColor, fill: palette.background, anchor: align, lineHeight: 1.4},
  );

  // Label tucked into a corner of the texture panel, on its own chip.
  const chipW = Math.min(texPanel.w, texPanel.h) * 0.5;
  const chipH = Math.min(texPanel.w, texPanel.h) * 0.12;
  const chip = {
    x: texPanel.x + texPanel.w - chipW - pad,
    y: texPanel.y + texPanel.h - chipH - pad,
    w: chipW,
    h: chipH,
  };
  block(ctx, chip, palette.background);
  drawHeadline(
    ctx,
    inset(chip, chipH * 0.18),
    bundle.label,
    textStyle(ctx, chipH * 0.5, heavyWeight(ctx)),
    {bg: palette.background, fill: palette.primary, align: 'middle'},
  );
}

registerComposition({name: 'diptych', weight: 2, render});
