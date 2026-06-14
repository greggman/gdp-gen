/**
 * Color field: two or three enormous Rothko-like blocks stacked to fill the
 * whole canvas, each a soft generator texture or a flat plane in a palette
 * color, separated by thin breathing gaps. Type is minimal and reversed -- a
 * single confident headline floating low in one field, a whisper of a label in
 * another. Vast, meditative, color-as-subject.
 */
import {registerComposition} from '../core/registry.js';
import {DesignContext, Rect} from '../core/types.js';
import {inset} from '../layout/geometry.js';
import {drawHeadline, drawLine} from '../typography/fitText.js';
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
  // Deep ground so the gaps between fields read as glowing seams.
  fillBackground(ctx, palette.backgroundIsDark ? palette.background : palette.text);

  const landscape = ctx.width >= ctx.height;
  const n = rng.int(2, 3);
  const gap = Math.min(ctx.width, ctx.height) * rng.range(0.01, 0.03);

  // Uneven field sizes for tension: weight one field much larger.
  const weights: number[] = [];
  for (let i = 0; i < n; i++) weights.push(rng.range(0.6, 1));
  const big = rng.int(0, n - 1);
  weights[big] *= rng.range(1.8, 2.6);
  const total = weights.reduce((a, b) => a + b, 0);

  // Stack along the long axis for the classic tall Rothko register.
  const splitVertical = landscape ? rng.chance(0.4) : false;
  const full = ctx.bounds();
  const fields: Rect[] = [];
  if (splitVertical) {
    let x = 0;
    for (let i = 0; i < n; i++) {
      const w = (full.w - gap * (n - 1)) * (weights[i] / total);
      fields.push({x, y: 0, w, h: full.h});
      x += w + gap;
    }
  } else {
    let y = 0;
    for (let i = 0; i < n; i++) {
      const h = (full.h - gap * (n - 1)) * (weights[i] / total);
      fields.push({x: 0, y, w: full.w, h});
      y += h + gap;
    }
  }

  const fieldColors = rng.shuffle([palette.primary, palette.accent, palette.colors[3] ?? palette.primary]);

  // Track each field's solid color so reversed text can be contrast-corrected
  // even when the field is a texture (we draw a solid scrim first).
  const fieldSolid: string[] = [];
  fields.forEach((f, i) => {
    const color = fieldColors[i % fieldColors.length];
    fieldSolid[i] = color;
    // Lay the solid plane, then optionally a soft texture floating within it
    // (inset so the color border frames it -- the Rothko hovering rectangle).
    block(ctx, f, color);
    if (rng.chance(0.75)) {
      const pad = Math.min(f.w, f.h) * rng.range(0.04, 0.1);
      ctx.fillRegion(inset(f, pad));
    }
  });

  const bundle = textBundle(ctx);
  if (!bundle) return;

  const rtl = isRtl(ctx);
  const heavy = heavyWeight(ctx);
  const m = margin(ctx, 0.06);

  // Headline: low in the largest field, reversed, on a solid backing band so it
  // reads over whatever texture floats there.
  const hf = fields[big];
  const hSize = displaySize(ctx, rng.range(0.07, 0.12));
  drawHeadline(
    ctx,
    {x: hf.x + m, y: hf.y + hf.h - hSize * 1.8, w: hf.w - m * 2, h: hSize * 1.2},
    bundle.headline,
    textStyle(ctx, hSize, heavy),
    {mode: 'bleed', backing: true, bg: fieldSolid[big], align: rtl ? 'end' : 'start'},
  );

  // A whisper of a label in a different field, small and reversed.
  const lf = (big + 1) % fields.length;
  const f = fields[lf];
  drawLine(
    ctx,
    rtl ? f.x + f.w - m : f.x + m,
    f.y + m + displaySize(ctx, 0.024),
    `${bundle.label}  ·  ${bundle.sub}`,
    textStyle(ctx, displaySize(ctx, 0.024), heavy),
    {bg: fieldSolid[lf], anchor: rtl ? 'end' : 'start', minContrast: 4.5},
  );
}

registerComposition({name: 'color-field', weight: 2, render});
