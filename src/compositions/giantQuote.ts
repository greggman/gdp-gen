/**
 * Giant quote: an oversized pull-quote dominates the canvas, set as a few huge
 * left-flushed lines that nearly span the width, with a colossal quotation mark
 * as a graphic anchor and a tiny attribution line tucked in a corner. Extreme
 * scale contrast, active negative space, type-as-image. Editorial / exhibition
 * poster energy.
 */
import {registerComposition} from '../core/registry.js';
import {Color, DesignContext, Rect} from '../core/types.js';
import {inset} from '../layout/geometry.js';
import {drawLine, fitSizeToWidth, measureWidth, wrapText} from '../typography/fitText.js';
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
  // Bold flat ground: solid color about half the time, plain background otherwise.
  const onColor = rng.chance(0.5);
  const ground: Color = onColor ? regionFill(ctx, rng) : palette.background;
  fillBackground(ctx, ground);
  const fill: Color = onColor ? palette.background : palette.text;

  const bundle = textBundle(ctx);
  if (!bundle) {
    // No text: a giant glyph-like block composition. One huge quote-mark bar
    // pair plus a generator field for the protagonist texture.
    const region: Rect = {
      x: 0,
      y: ctx.height * rng.range(0.3, 0.5),
      w: ctx.width,
      h: ctx.height * rng.range(0.4, 0.6),
    };
    ctx.fillRegion(region);
    const qs = Math.min(ctx.width, ctx.height) * 0.4;
    for (let i = 0; i < 2; i++) {
      block(
        ctx,
        {x: ctx.width * (0.08 + i * 0.16), y: ctx.height * 0.06, w: qs * 0.18, h: qs * 0.5},
        i % 2 ? palette.accent : palette.primary,
      );
    }
    return;
  }

  const rtl = isRtl(ctx);
  const anchor = rtl ? 'end' : 'start';
  const weight = heavyWeight(ctx);
  const m = margin(ctx, 0.06);

  // The pull-quote text: build from body lines for length, fall back to sub.
  const quoteSource =
    bundle.body.join(' ').trim() || `${bundle.headline} ${bundle.sub}`;

  // A colossal opening quotation mark as the graphic anchor, off to one side.
  const markSize = displaySize(ctx, rng.range(0.5, 0.75));
  const markColor: Color = onColor ? palette.background : regionFill(ctx, rng);
  const markX = rtl ? ctx.width - m * 0.4 : m * 0.4;
  drawLine(
    ctx,
    markX,
    m + markSize * 0.78,
    '“',
    textStyle(ctx, markSize, weight),
    {bg: ground, fill: markColor, anchor, minContrast: 1},
  );

  // The quote occupies the lower 60-70% of the canvas, flush to the text edge,
  // sized so each line nearly fills the available width -> huge confident type.
  const quoteTop = ctx.height * rng.range(0.28, 0.36);
  const quoteArea = inset(
    {x: 0, y: quoteTop, w: ctx.width, h: ctx.height - quoteTop - m},
    0,
    0,
  );
  const textX = rtl ? ctx.width - m : m;
  const colW = ctx.width - m * 2;

  // Choose a line count, then size lines so the longest wrapped line fills colW.
  const lineCount = rng.int(3, 5);
  // Probe size: tall enough to wrap into roughly lineCount lines.
  let size = quoteArea.h / (lineCount * 1.12);
  let style = textStyle(ctx, size, weight);
  let lines = wrapText(quoteSource, colW, style);
  // If it wrapped too few lines, the text is short -- grow to fill the width.
  if (lines.length <= 1) {
    size = fitSizeToWidth(quoteSource, colW, textStyle(ctx, ctx.height, weight), 12);
    style = textStyle(ctx, size, weight);
    lines = [quoteSource];
  } else {
    // Tighten so the stack fits the area exactly.
    const fit = quoteArea.h / (lines.length * 1.1);
    size = Math.min(size, fit);
    style = textStyle(ctx, size, weight);
    lines = wrapText(quoteSource, colW, style);
  }

  const lineH = size * 1.06;
  // Bottom-anchor the stack so the negative space sits above, around the mark.
  let y = quoteArea.y + quoteArea.h - (lines.length - 1) * lineH - size * 0.1;
  for (const line of lines) {
    drawLine(ctx, textX, y, line, style, {bg: ground, fill, anchor, minContrast: 3});
    y += lineH;
  }

  // Tiny attribution, corner-tucked opposite the quote mark.
  const attrStyle = textStyle(ctx, displaySize(ctx, 0.024), weight);
  const attr = `— ${bundle.sub}, ${bundle.label}`;
  const attrW = measureWidth(attr, attrStyle);
  const attrX = rtl ? m + attrW : ctx.width - m;
  drawLine(ctx, attrX, ctx.height - m * 0.55, attr, attrStyle, {
    bg: ground,
    fill,
    anchor: rtl ? 'start' : 'end',
  });
}

registerComposition({name: 'giant-quote', weight: 2, render});
