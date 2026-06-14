/**
 * Spec sheet: a brutalist technical-datasheet layout. A dense column of
 * label/value rows runs down one flank (monospaced engineering-document energy),
 * while ONE colossal code or numeral dominates the rest of the canvas, bleeding
 * off the edge over a generator field. Extreme scale contrast, hard grid tension,
 * Designers-Republic / brutalist-web register.
 */
import {registerComposition} from '../core/registry.js';
import {Color, DesignContext, Rect} from '../core/types.js';
import {splitX} from '../layout/geometry.js';
import {drawLine, fitSizeToWidth, measureWidth} from '../typography/fitText.js';
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

/** A big code string from the label, or a fabricated spec code. */
function bigCode(ctx: DesignContext, label: string | null): string {
  const digits = label ? label.replace(/[^0-9A-Za-z]/g, '') : '';
  if (digits.length >= 2) return digits.slice(0, ctx.rng.int(2, 3)).toUpperCase();
  return String(ctx.rng.int(10, 99));
}

function render(ctx: DesignContext): void {
  const {rng, palette} = ctx;
  const {width: W, height: H} = ctx;
  const rtl = isRtl(ctx);

  const bgIsDark = rng.chance(0.55);
  const bg: Color = bgIsDark ? palette.primary : palette.background;
  fillBackground(ctx, bg);

  // Narrow spec column on one side; the giant glyph owns the rest.
  const colFrac = rng.range(0.26, 0.36);
  const colLeft = rtl ? !rng.chance(0.7) : rng.chance(0.4);
  const [a, b] = splitX(ctx.bounds(), colLeft ? colFrac : 1 - colFrac);
  const specCol: Rect = colLeft ? a : b;
  const stage: Rect = colLeft ? b : a;

  // A generator field fills a large asymmetric region of the stage -- protagonist.
  const fieldFromTop = rng.chance(0.5);
  const fieldH = stage.h * rng.range(0.5, 0.75);
  const fieldRect: Rect = {
    x: stage.x,
    y: fieldFromTop ? stage.y : stage.y + stage.h - fieldH,
    w: stage.w,
    h: fieldH,
  };
  ctx.fillRegion(fieldRect);

  // Solid spec-column plate (flat color blocking) so dense text stays legible.
  const colColor: Color = bgIsDark ? palette.background : palette.primary;
  block(ctx, specCol, colColor);

  const bundle = textBundle(ctx);

  // The colossal code/numeral: filling most of the stage height, bleeding off.
  const glyph = bigCode(ctx, bundle ? bundle.label : null);
  const weight = heavyWeight(ctx);
  const probe = textStyle(ctx, H, weight);
  const targetH = H * rng.range(0.85, 1.08);
  const byWidth = fitSizeToWidth(glyph, stage.w * rng.range(1.0, 1.35), probe);
  const size = Math.min(targetH, byWidth);
  const glyphStyle = textStyle(ctx, size, weight);
  const glyphW = measureWidth(glyph, glyphStyle);

  // Plate behind the glyph guarantees contrast over the texture.
  const plateColor: Color = rng.chance(0.5) ? regionFill(ctx, rng) : palette.accent;
  const overhang = size * rng.range(0.06, 0.18);
  // Anchor glyph to the outer edge of the stage and let it overhang.
  const glyphRight = colLeft; // stage is on the right when colLeft.
  const glyphX = glyphRight ? stage.x + stage.w - overhang : stage.x + overhang;
  const anchor = glyphRight ? 'end' : 'start';
  const glyphY = stage.y + stage.h * 0.5 + size * 0.36;
  const plateW = glyphW + size * 0.34;
  const plateX = anchor === 'end' ? glyphX - plateW + overhang * 0.5 : glyphX - overhang * 0.5;
  block(ctx, {x: plateX, y: stage.y, w: plateW, h: stage.h}, plateColor);
  drawLine(ctx, glyphX, glyphY, glyph, glyphStyle, {
    bg: plateColor,
    fill: rng.chance(0.5) ? palette.background : palette.primary,
    minContrast: 3,
    anchor,
  });

  if (!bundle) return;

  // Dense brutalist label/value rows down the spec column.
  const m = margin(ctx, 0.025);
  const inner: Rect = {x: specCol.x + m, y: specCol.y + m, w: specCol.w - m * 2, h: specCol.h - m * 2};
  const align = rtl ? 'end' : 'start';
  const rowAnchorX = rtl ? inner.x + inner.w : inner.x;

  // Column header: a small all-caps spec title.
  const headSize = Math.min(inner.w * 0.16, displaySize(ctx, 0.04));
  let y = inner.y + headSize;
  drawLine(ctx, rowAnchorX, y, bundle.sub, textStyle(ctx, headSize, weight), {
    bg: colColor,
    fill: palette.text,
    minContrast: 4.5,
    anchor: align,
  });
  y += headSize * 0.6;

  // A separating rule under the header (functional, not decorative-primary).
  block(ctx, {x: inner.x, y, w: inner.w, h: Math.max(2, headSize * 0.08)}, palette.accent);
  y += headSize * 0.9;

  // Rows: label on one side, short value on the other -- packed tightly.
  const rowLabels = [...bundle.body, bundle.sub, bundle.headline];
  const rowSize = Math.min(inner.w * 0.085, displaySize(ctx, 0.02));
  const rowH = rowSize * 1.85;
  const maxRows = Math.floor((inner.y + inner.h - y) / rowH);
  const codes = ['REV', 'STD', 'CAT', 'SEQ', 'DIM', 'LOT', 'VER', 'IDX'];
  for (let i = 0; i < Math.min(maxRows, rowLabels.length, 8); i++) {
    const ry = y + rowSize + i * rowH;
    // Label (truncated to fit roughly half the column).
    const labelText = rowLabels[i];
    const half = inner.w * 0.6;
    const ls = textStyle(ctx, rowSize, 400);
    const fitSize = Math.min(rowSize, fitSizeToWidth(labelText, half, ls));
    drawLine(ctx, rowAnchorX, ry, labelText, textStyle(ctx, fitSize, 400), {
      bg: colColor,
      fill: palette.text,
      minContrast: 4.5,
      anchor: align,
    });
    // Value/code stamped on the opposite edge in heavy weight.
    const valX = rtl ? inner.x : inner.x + inner.w;
    drawLine(
      ctx,
      valX,
      ry,
      `${codes[i % codes.length]}·${rng.int(10, 99)}`,
      textStyle(ctx, rowSize * 0.9, weight),
      {bg: colColor, fill: palette.accent, minContrast: 3, anchor: rtl ? 'start' : 'end'},
    );
    // Hairline divider between rows.
    if (i < Math.min(maxRows, rowLabels.length) - 1) {
      block(
        ctx,
        {x: inner.x, y: ry + rowH * 0.32, w: inner.w, h: 1},
        palette.text,
      ).setAttribute('opacity', '0.3');
    }
  }
}

registerComposition({name: 'spec-sheet', weight: 2, render});
