/**
 * Ransom note: the headline is broken into individual letters (or syllable
 * chunks for CJK), each stamped at a wildly different size, baseline jitter and
 * rotation on its own colored block -- the cut-and-paste kidnapper aesthetic of
 * punk zines and Sex Pistols sleeves. The chunks march across a full-bleed
 * generator texture, with supporting type reversed out of solid chips below.
 */
import {registerComposition} from '../core/registry.js';
import {DesignContext, Rect} from '../core/types.js';
import {drawHeadline, drawLine, measureWidth} from '../typography/fitText.js';
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

/** Splits a headline into ransom chunks: words for spaced scripts, glyphs else. */
function chunks(text: string): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  // Explode words into letters so the size contrast is per-letter and loud.
  const out: string[] = [];
  for (const w of words) {
    if (w.length <= 2) {
      out.push(w);
    } else {
      // Break long words into 1-2 char fragments for cut-paper rhythm.
      for (let i = 0; i < w.length; ) {
        const take = w.length - i <= 3 ? w.length - i : 1 + (i % 2);
        out.push(w.slice(i, i + take));
        i += take;
      }
    }
  }
  return out.length ? out : [text];
}

function render(ctx: DesignContext): void {
  const {rng, palette} = ctx;
  fillBackground(ctx);

  // Full-bleed generator texture as the protagonist background.
  ctx.fillRegion(ctx.bounds());

  const heavy = heavyWeight(ctx);

  const bundle = textBundle(ctx);
  if (!bundle) {
    // No text: scatter bold colored chips across the texture for paste rhythm.
    const chipColors = [palette.primary, palette.accent, palette.background];
    const n = rng.int(7, 14);
    for (let i = 0; i < n; i++) {
      const w = ctx.width * rng.range(0.08, 0.22);
      const h = w * rng.range(0.7, 1.3);
      const r: Rect = {x: rng.range(0, ctx.width - w), y: rng.range(0, ctx.height - h), w, h};
      const g = ctx.group();
      block(ctx, r, rng.pick(chipColors), g);
      g.setAttribute(
        'transform',
        `rotate(${rng.range(-14, 14).toFixed(1)} ${(r.x + r.w / 2).toFixed(1)} ${(r.y + r.h / 2).toFixed(1)})`,
      );
    }
    return;
  }

  const rtl = isRtl(ctx);
  const pieces = chunks(bundle.headline);

  // Lay the ransom chunks across a wide central band, wrapping into rows. Each
  // chunk sits on its own paper block in a rotated group, jittered baseline.
  const m = margin(ctx, 0.05);
  const bandTop = ctx.height * rng.range(0.14, 0.22);
  const bandH = ctx.height * rng.range(0.5, 0.6);
  const avail = ctx.width - m * 2;
  const chipColors = [palette.primary, palette.accent, palette.background, palette.text];

  // Decide a base chunk height; bigger chunks dominate via per-chunk multiplier.
  const rows = Math.max(1, Math.round(Math.sqrt(pieces.length) * rng.range(0.8, 1.2)));
  const rowH = bandH / rows;
  const ordered = rtl ? pieces.slice().reverse() : pieces;

  let cx = m;
  let row = 0;
  const gap = rowH * 0.08;
  for (const piece of ordered) {
    // Per-chunk scale: occasionally enormous for extreme contrast.
    const scale = rng.weighted([0.5, 0.8, 1.1, 1.6], [2, 3, 2, 1]);
    const size = rowH * scale * 0.78;
    const style = textStyle(ctx, size, heavy);
    const tw = measureWidth(piece, style);
    const chipW = tw + size * 0.36;
    const chipH = size * 1.18;

    if (cx + chipW > m + avail && cx > m) {
      row += 1;
      cx = m;
      if (row >= rows) break;
    }
    const cy = bandTop + row * rowH + (rowH - chipH) / 2 + rng.range(-rowH * 0.12, rowH * 0.12);

    const chipColor = rng.pick(chipColors);
    const g = ctx.group();
    const r: Rect = {x: cx, y: cy, w: chipW, h: chipH};
    block(ctx, r, chipColor, g);
    // Center the glyph in its chip and let drawLine contrast-correct.
    drawLine(ctx, r.x + chipW / 2, r.y + chipH * 0.5 + size * 0.35, piece, style, {
      bg: chipColor,
      anchor: 'middle',
      minContrast: 4.5,
      parent: g,
    });
    g.setAttribute(
      'transform',
      `rotate(${rng.range(-9, 9).toFixed(1)} ${(r.x + chipW / 2).toFixed(1)} ${(r.y + chipH / 2).toFixed(1)})`,
    );
    cx += chipW + gap;
  }

  // Supporting type reversed out of two solid chips along the bottom.
  const footY = bandTop + bandH + ctx.height * 0.02;
  const footH = ctx.height - footY - m * 0.5;
  if (footH > ctx.height * 0.06) {
    const subColor = palette.primary;
    const subChip: Rect = {x: m, y: footY, w: avail * rng.range(0.55, 0.7), h: footH * 0.5};
    block(ctx, subChip, subColor);
    drawHeadline(
      ctx,
      {x: subChip.x + footH * 0.12, y: subChip.y, w: subChip.w - footH * 0.24, h: subChip.h},
      bundle.sub,
      textStyle(ctx, displaySize(ctx, 0.045), heavy),
      {bg: subColor, fill: palette.background, align: rtl ? 'end' : 'start'},
    );

    const labelChip: Rect = {
      x: rtl ? m : ctx.width - m - avail * 0.3,
      y: footY + footH * 0.55,
      w: avail * 0.3,
      h: footH * 0.4,
    };
    block(ctx, labelChip, palette.accent);
    drawHeadline(
      ctx,
      labelChip,
      bundle.label,
      textStyle(ctx, labelChip.h * 0.5, heavy),
      {bg: palette.accent, fill: palette.background, align: 'middle'},
    );
  }
}

registerComposition({name: 'ransom-note', weight: 2, render});
