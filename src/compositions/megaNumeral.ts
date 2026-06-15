/**
 * Mega numeral: one colossal numeral or glyph dominates the canvas, filling
 * 70-100% of the height and bleeding off an edge, set over (or as a window
 * into) a generator field. Small supporting text is tucked into one corner.
 * Extreme scale contrast in the Reid Miles / Swiss poster tradition.
 */
import {registerComposition} from '../core/registry.js';
import {Color, DesignContext} from '../core/types.js';
import {drawLine, fitSizeToWidth} from '../typography/fitText.js';
import {
  backdrop,
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

  // A flat, bold color field (the classic mega-numeral stage), with an optional
  // MUTED backdrop texture for interest -- no rectangle around the number.
  const bgColor: Color = rng.chance(0.6) ? regionFill(ctx, rng) : palette.background;
  fillBackground(ctx, bgColor);
  backdrop(ctx, 0.5);

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

  // Anchor the glyph hard to one side and let it overhang -- straight on the
  // flat field, no backing plate. Its color is contrast-corrected vs the field.
  const fromLeft = rng.chance(0.5);
  const overhang = size * rng.range(0.04, 0.16);
  const glyphX = fromLeft ? ctx.width - overhang : overhang;
  const anchor = fromLeft ? 'end' : 'start';
  const glyphY = ctx.height * 0.5 + size * 0.36;
  const glyphFill = rng.chance(0.5) ? palette.primary : palette.accent;
  drawLine(ctx, glyphX, glyphY, glyph, glyphStyle, {
    bg: bgColor,
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
