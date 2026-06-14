/**
 * Mega numeral: one colossal numeral or glyph dominates the canvas, filling
 * 70-100% of the height and bleeding off an edge, set over (or as a window
 * into) a generator field. Small supporting text is tucked into one corner.
 * Extreme scale contrast in the Reid Miles / Swiss poster tradition.
 */
import {registerComposition} from '../core/registry.js';
import {Color, DesignContext} from '../core/types.js';
import {fitSizeToWidth, measureWidth, drawLine} from '../typography/fitText.js';
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

/** Pulls a striking single glyph from the label, else a random digit. */
function pickGlyph(ctx: DesignContext, label: string | null): string {
  const digits = label ? label.replace(/[^0-9]/g, '') : '';
  if (digits.length >= 1) {
    // Prefer a two-digit slice for chunky presence, else one digit.
    if (digits.length >= 2 && ctx.rng.chance(0.5)) {
      const i = ctx.rng.int(0, digits.length - 2);
      return digits.slice(i, i + 2);
    }
    return digits[ctx.rng.int(0, digits.length - 1)];
  }
  return String(ctx.rng.int(0, 9));
}

function render(ctx: DesignContext): void {
  const {rng, palette} = ctx;
  const bundle = textBundle(ctx);

  // Bold color blocking: pick a strong field color and a contrasting glyph.
  const fieldColor: Color = regionFill(ctx, rng);
  const bgColor = rng.chance(0.55) ? palette.background : fieldColor;
  fillBackground(ctx, bgColor);

  // A large generator field occupies a big asymmetric band so the texture is a
  // protagonist, not an accent. The giant glyph overlaps it.
  const bandFromLeft = rng.chance(0.5);
  const bandFrac = rng.range(0.45, 0.7);
  const bandW = ctx.width * bandFrac;
  const bandX = bandFromLeft ? 0 : ctx.width - bandW;
  ctx.fillRegion({x: bandX, y: 0, w: bandW, h: ctx.height});

  // Determine the glyph string (from the label when text exists).
  const glyph = pickGlyph(ctx, bundle ? bundle.label : null);
  const weight = heavyWeight(ctx);

  // Size the glyph so it fills most of the canvas height, then push it so it
  // bleeds off one side -- off-centre, never balanced.
  const probe = textStyle(ctx, ctx.height, weight);
  const targetH = ctx.height * rng.range(1.02, 1.22);
  const byWidth = fitSizeToWidth(glyph, ctx.width * rng.range(0.95, 1.3), probe);
  const size = Math.min(targetH, byWidth);
  const glyphStyle = textStyle(ctx, size, weight);
  const glyphW = measureWidth(glyph, glyphStyle);

  // Anchor the glyph hard to one side and let it overhang.
  const overhang = size * rng.range(0.04, 0.16);
  const glyphX = bandFromLeft ? ctx.width - overhang : overhang;
  const anchor = bandFromLeft ? 'end' : 'start';
  const glyphY = ctx.height * 0.5 + size * 0.36;

  // The glyph sits over both the texture band and the flat field; back it with a
  // solid plate so contrast is guaranteed regardless of texture beneath.
  const plateColor = rng.chance(0.5) ? fieldColor : palette.primary;
  const plateW = glyphW + size * 0.3;
  const plateX = anchor === 'end' ? glyphX - plateW + overhang * 0.5 : glyphX - overhang * 0.5;
  block(
    ctx,
    {x: plateX, y: 0, w: plateW, h: ctx.height},
    plateColor,
  );
  const glyphFill = rng.chance(0.5) ? palette.background : palette.accent;
  drawLine(ctx, glyphX, glyphY, glyph, glyphStyle, {
    bg: plateColor,
    fill: glyphFill,
    minContrast: 3,
    anchor,
  });

  if (!bundle) return;

  // Small supporting text tucked into one corner -- deliberate active negative
  // space, headline tiny against the enormous numeral.
  const rtl = isRtl(ctx);
  const m = margin(ctx, 0.05);
  const cornerTop = rng.chance(0.5);
  const tx = rtl ? ctx.width - m : m;
  const tAnchor = rtl ? 'end' : 'start';
  const small = displaySize(ctx, 0.03);
  const lineH = small * 1.35;

  const lines = [bundle.headline, bundle.sub, bundle.label].filter(Boolean);
  let ty = cornerTop ? m + small : ctx.height - m - lineH * (lines.length - 1);
  lines.forEach((line, i) => {
    const s = textStyle(ctx, i === 0 ? small * 1.15 : small * 0.8, i === 0 ? weight : 400);
    drawLine(ctx, tx, ty, line, s, {bg: bgColor, fill: palette.text, anchor: tAnchor});
    ty += lineH;
  });
}

registerComposition({name: 'mega-numeral', weight: 3, render});
