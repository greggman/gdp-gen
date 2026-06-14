/**
 * Split duotone: the canvas is divided into two fields (vertical or horizontal,
 * at a half or golden split). One field is a solid color or generator texture;
 * the other carries the text. High-contrast, bold -- think concert and club
 * flyers.
 */
import {registerComposition} from '../core/registry.js';
import {Color, DesignContext, Rect} from '../core/types.js';
import {GOLDEN, splitX, splitY} from '../layout/geometry.js';
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

  const vertical = ctx.width >= ctx.height ? rng.chance(0.7) : rng.chance(0.3);
  const t = rng.chance(0.5) ? 0.5 : rng.chance(0.5) ? 1 / GOLDEN : 1 - 1 / GOLDEN;
  const full: Rect = {x: 0, y: 0, w: ctx.width, h: ctx.height};
  const [a, b] = vertical ? splitX(full, t) : splitY(full, t);

  // Color field vs. text field.
  const colorFirst = rng.chance(0.5);
  const colorField = colorFirst ? a : b;
  const textField = colorFirst ? b : a;
  const fieldColor: Color = rng.chance(0.5) ? palette.primary : palette.accent;
  // Either a solid color field or a generator texture filling it (favour
  // texture so the large field rarely reads as an empty slab).
  const textured = rng.chance(0.82);
  if (textured) {
    ctx.fillRegion(colorField);
  } else {
    ctx.root.appendChild(
      ctx.el('rect', {
        x: colorField.x,
        y: colorField.y,
        width: colorField.w,
        height: colorField.h,
        fill: fieldColor,
      }),
    );
  }

  const bundle = textBundle(ctx);
  if (!bundle) return;

  const m = margin(ctx, 0.05);
  const tf: Rect = {x: textField.x + m, y: textField.y + m, w: textField.w - m * 2, h: textField.h - m * 2};
  const rtl = isRtl(ctx);
  const anchor = rtl ? 'end' : 'start';

  drawHeadline(
    ctx,
    {x: tf.x, y: tf.y, w: tf.w, h: tf.h * 0.4},
    bundle.headline,
    textStyle(ctx, displaySize(ctx, rng.range(0.12, 0.18)), heavyWeight(ctx)),
    {bg: palette.background, fill: palette.text, align: anchor},
  );
  drawParagraph(
    ctx,
    {x: tf.x, y: tf.y + tf.h * 0.5, w: tf.w, h: tf.h * 0.45},
    bundle.body.join('  '),
    textStyle(ctx, displaySize(ctx, 0.02)),
    {bg: palette.background, fill: palette.text, anchor},
  );

  // Reversed label on the color field. If the field is textured, lay a solid
  // strip behind the label so it always sits on a known color.
  const labelBandH = ctx.height * 0.1;
  const labelBandY = colorField.y + colorField.h - labelBandH;
  if (textured) {
    block(ctx, {x: colorField.x, y: labelBandY, w: colorField.w, h: labelBandH}, fieldColor);
  }
  drawHeadline(
    ctx,
    {x: colorField.x + m, y: labelBandY + labelBandH * 0.2, w: colorField.w - m * 2, h: labelBandH * 0.6},
    bundle.sub,
    textStyle(ctx, displaySize(ctx, 0.03), heavyWeight(ctx)),
    {bg: fieldColor, fill: palette.background, align: 'middle'},
  );
}

registerComposition({name: 'split-duotone', weight: 3, render});
