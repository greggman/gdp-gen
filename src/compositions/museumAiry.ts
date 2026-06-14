/**
 * Museum-airy: bold minimalism for a blockbuster exhibition poster. ONE
 * enormous element dominates -- either a colossal headline bleeding off the
 * edges or a single huge generator field -- carried by confident, asymmetric
 * negative space. A thick accent bar and a giant edition numeral anchor the
 * composition off-center. No tiny text floating in the middle of the void.
 */
import {registerComposition} from '../core/registry.js';
import {Color, DesignContext, Rect} from '../core/types.js';
import {GOLDEN, splitX, splitY} from '../layout/geometry.js';
import {drawHeadline, drawLine, fitSizeToWidth, measureWidth} from '../typography/fitText.js';
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
  const bg: Color = palette.background;
  fillBackground(ctx, bg);

  const rtl = isRtl(ctx);
  const startAlign = rtl ? 'end' : 'start';
  const m = margin(ctx, 0.06);
  const weight = heavyWeight(ctx);

  const bundle = textBundle(ctx);
  if (!bundle) {
    // No text: a single colossal generator field occupies most of the canvas,
    // pushed hard to one edge so the remaining whitespace is an active,
    // asymmetric shape rather than an even margin. A thick accent bar slices in.
    const full: Rect = ctx.bounds();
    const vertical = ctx.width >= ctx.height;
    const t = rng.range(0.62, 0.78);
    const [a, b] = vertical ? splitX(full, t) : splitY(full, t);
    const field = rng.chance(0.5) ? a : b;
    ctx.fillRegion(field);
    // Thick bar crossing the negative-space side.
    const empty = field === a ? b : a;
    const barThick = Math.min(ctx.width, ctx.height) * rng.range(0.06, 0.1);
    if (vertical) {
      const by = empty.y + empty.h * rng.range(0.3, 0.6);
      block(ctx, {x: empty.x, y: by, w: empty.w, h: barThick}, palette.accent);
    } else {
      const bx = empty.x + empty.w * rng.range(0.3, 0.6);
      block(ctx, {x: bx, y: empty.y, w: barThick, h: empty.h}, palette.accent);
    }
    return;
  }

  // A giant edition numeral, drawn as the secondary protagonist in negative
  // space (a single glyph at enormous scale -- extreme scale contrast).
  const numeral = String(rng.int(1, 9));

  // Decide which big move leads: a colossal bleeding headline, or a huge
  // generator field beside a tall stacked headline. Either way ONE element is
  // enormous and the layout is deliberately asymmetric.
  const headlineLed = rng.chance(0.6);

  if (headlineLed) {
    // --- Colossal headline bleeding off the edges. ---
    // Optional huge generator field anchored to one edge, behind/beside type.
    const fieldFrac = rng.range(0.28, 0.42);
    const fieldOnRight = rtl ? rng.chance(0.35) : rng.chance(0.65);
    const fieldW = ctx.width * fieldFrac;
    const fieldRect: Rect = {
      x: fieldOnRight ? ctx.width - fieldW : 0,
      y: 0,
      w: fieldW,
      h: ctx.height,
    };
    ctx.fillRegion(fieldRect);

    // Stack the headline words as huge lines that overshoot the width and bleed
    // off the open edge. Each line gets a backing band for guaranteed contrast
    // where it crosses the generator field.
    const words = bundle.headline.split(/\s+/).filter(Boolean);
    const lines = words.length >= 2 ? words : [bundle.headline];
    const lineH = (ctx.height - m * 2) / (lines.length + 0.3);
    // Flush the type toward the OPEN side (away from the generator field) so it
    // bleeds into the whitespace; align consistently for a strong vertical edge.
    const flushRight = !fieldOnRight;
    const align = flushRight ? 'end' : 'start';

    lines.forEach((line, i) => {
      const probe = textStyle(ctx, ctx.height, weight);
      const target = ctx.width * rng.range(1.05, 1.28);
      const size = Math.min(lineH * 1.18, fitSizeToWidth(line, target, probe, 8));
      const style = textStyle(ctx, size, weight);
      const y = m + lineH * (i + 0.85);
      const rect: Rect = {x: m, y: y - lineH, w: ctx.width - m * 2, h: lineH};
      drawHeadline(ctx, rect, line, style, {
        mode: 'bleed',
        backing: true,
        bg,
        fill: palette.primary,
        align,
        minContrast: 3,
      });
    });

    // Thick accent bar bleeding across, off-center, top third.
    const barY = ctx.height * rng.range(0.06, 0.16);
    const barH = Math.min(ctx.width, ctx.height) * rng.range(0.02, 0.035);
    block(ctx, {x: -10, y: barY, w: ctx.width + 20, h: barH}, palette.accent);

    // Small supporting label pinned to a bottom corner, on the open side.
    const labelY = ctx.height - m;
    const labelStyle = textStyle(ctx, displaySize(ctx, 0.024), weight);
    const labelText = `${bundle.sub} · ${bundle.label}`;
    if (flushRight) {
      const w = measureWidth(labelText, labelStyle);
      drawLine(ctx, ctx.width - m - w, labelY, labelText, labelStyle, {
        bg,
        fill: palette.text,
        anchor: 'start',
      });
    } else {
      drawLine(ctx, m, labelY, labelText, labelStyle, {
        bg,
        fill: palette.text,
        anchor: 'start',
      });
    }
    return;
  }

  // --- Huge generator field + giant numeral, with a tall headline. ---
  const full: Rect = ctx.bounds();
  const t = rng.chance(0.5) ? 1 / GOLDEN : rng.range(0.55, 0.7);
  const [left, right] = splitX(full, t);
  // The larger slab carries the generator; the narrower slab carries type.
  const big = left.w >= right.w ? left : right;
  const small = big === left ? right : left;
  const fieldRect = big;
  ctx.fillRegion(fieldRect);

  // A giant numeral reversed over a solid backing block sitting on the field,
  // anchored to a corner -- extreme scale contrast, type-on-color.
  const numChip: Rect = {
    x: fieldRect.x + fieldRect.w * 0.06,
    y: fieldRect.y + fieldRect.h * (rng.chance(0.5) ? 0.06 : 0.62),
    w: fieldRect.w * 0.5,
    h: fieldRect.h * 0.32,
  };
  block(ctx, numChip, palette.primary);
  drawHeadline(
    ctx,
    numChip,
    numeral,
    textStyle(ctx, displaySize(ctx, 0.5), weight),
    {bg: palette.primary, fill: palette.background, align: 'middle', mode: 'shrink'},
  );

  // The text slab: a tall stacked headline reading down the narrow column, plus
  // a label. Generous whitespace within the column keeps it airy but confident.
  const tf: Rect = {x: small.x + m, y: m, w: small.w - m * 2, h: ctx.height - m * 2};
  const align = rtl ? 'end' : 'start';
  const headWords = bundle.headline.split(/\s+/).filter(Boolean);
  const headLines = headWords.length >= 2 ? headWords : [bundle.headline];
  const hLineH = (tf.h * 0.7) / (headLines.length + 0.3);
  headLines.forEach((line, i) => {
    const size = Math.min(
      hLineH * 1.1,
      fitSizeToWidth(line, tf.w, textStyle(ctx, ctx.height, weight), 8),
    );
    const style = textStyle(ctx, size, weight);
    const rect: Rect = {x: tf.x, y: tf.y + hLineH * i, w: tf.w, h: hLineH};
    drawHeadline(ctx, rect, line, style, {
      bg,
      fill: palette.primary,
      align,
      mode: 'shrink',
    });
  });

  // Sub + label anchored to the bottom of the text column.
  const labelStyle = textStyle(ctx, displaySize(ctx, 0.026), weight);
  drawHeadline(
    ctx,
    {x: tf.x, y: ctx.height - m - ctx.height * 0.08, w: tf.w, h: ctx.height * 0.05},
    bundle.sub,
    labelStyle,
    {bg, fill: palette.accent, align, mode: 'shrink'},
  );
  drawHeadline(
    ctx,
    {x: tf.x, y: ctx.height - m - ctx.height * 0.03, w: tf.w, h: ctx.height * 0.03},
    bundle.label,
    textStyle(ctx, displaySize(ctx, 0.02), weight),
    {bg, fill: palette.text, align, mode: 'shrink'},
  );
}

registerComposition({name: 'museum-airy', weight: 2, render});
