/**
 * Staircase: a flight of stepped blocks marches diagonally across the canvas,
 * each tread a bold flat plane (one of them a generator texture) carrying a
 * line of type. The descending diagonal drives the eye corner-to-corner; scale
 * jumps between the headline tread and the small detail treads. Bauhaus /
 * constructivist energy.
 */
import {registerComposition} from '../core/registry.js';
import {Color, DesignContext, Rect} from '../core/types.js';
import {drawHeadline} from '../typography/fitText.js';
import {
  block,
  fillBackground,
  heavyWeight,
  isRtl,
  regionFill,
  textBundle,
  textStyle,
} from './_composition.js';

function render(ctx: DesignContext): void {
  const {rng, palette} = ctx;
  const baseBg: Color = rng.chance(0.5) ? palette.background : palette.primary;
  fillBackground(ctx, baseBg);
  const altPlane = baseBg === palette.background ? palette.primary : palette.background;

  const bundle = textBundle(ctx);
  const rtl = isRtl(ctx);
  // Direction of descent: left->right top->bottom, or its mirror.
  const descendRight = rtl ? false : rng.chance(0.6);

  // Number of steps. Each step is a full-width band, but its colored tread only
  // covers part of the width, shifting along the diagonal step by step.
  const steps = rng.int(4, 6);
  const stepH = ctx.height / steps;
  const treadW = ctx.width * rng.range(0.5, 0.72);
  const overflow = ctx.width - treadW; // total horizontal travel across steps
  const shiftPer = steps > 1 ? overflow / (steps - 1) : 0;

  // Which step carries the giant headline, and which is the generator texture.
  const headStep = rng.int(1, steps - 2);
  let texStep = rng.int(0, steps - 1);
  if (texStep === headStep) texStep = (texStep + 1) % steps;
  const headPlane: Color = rng.chance(0.5) ? palette.primary : palette.accent;

  // Build treads and remember each tread's solid color (null for the texture).
  const treads: Rect[] = [];
  const treadColor: (Color | null)[] = [];
  for (let i = 0; i < steps; i++) {
    const baseX = i * shiftPer;
    const x = descendRight ? baseX : ctx.width - treadW - baseX;
    const r: Rect = {x, y: i * stepH, w: treadW, h: stepH};
    treads.push(r);

    if (i === texStep) {
      ctx.fillRegion(r);
      treadColor.push(null);
    } else {
      const fill: Color =
        i === headStep
          ? headPlane
          : i % 2 === 0
            ? regionFill(ctx, rng)
            : altPlane;
      block(ctx, r, fill);
      treadColor.push(fill);
    }
  }

  if (!bundle) {
    // No text: bold riser bars connecting the steps to stress the diagonal.
    for (let i = 0; i < steps - 1; i++) {
      const a = treads[i];
      const riserX = descendRight ? a.x + a.w - ctx.width * 0.02 : a.x;
      block(
        ctx,
        {x: riserX, y: a.y + a.h * 0.5, w: ctx.width * 0.02, h: a.h * 0.5},
        palette.accent,
      );
    }
    return;
  }

  const align = rtl ? 'end' : descendRight ? 'start' : 'end';
  const detail = [bundle.sub, bundle.label, ...bundle.body, bundle.english ?? bundle.sub];
  let di = 0;

  treads.forEach((r, i) => {
    const padX = r.w * 0.05;
    const inner: Rect = {x: r.x + padX, y: r.y, w: r.w - padX * 2, h: r.h};

    // Solid color the type sits on. Over the texture tread we lay a backing band.
    let under: Color;
    if (treadColor[i] === null) {
      const band = altPlane;
      const bandH = stepH * 0.62;
      const bandY = r.y + (stepH - bandH) / 2;
      block(ctx, {x: r.x, y: bandY, w: r.w, h: bandH}, band);
      under = band;
      inner.y = bandY;
      inner.h = bandH;
    } else {
      under = treadColor[i] as Color;
    }

    if (i === headStep) {
      // EXTREME SCALE: headline fills the tread height and bleeds off-edge.
      drawHeadline(
        ctx,
        {x: inner.x, y: inner.y, w: inner.w, h: stepH},
        bundle.headline,
        textStyle(ctx, stepH * rng.range(0.78, 0.95), heavyWeight(ctx)),
        {mode: 'bleed', backing: true, bg: under, align},
      );
    } else {
      const line = detail[di % detail.length];
      di++;
      drawHeadline(
        ctx,
        inner,
        line,
        textStyle(ctx, Math.min(inner.h, stepH) * 0.42, heavyWeight(ctx)),
        {bg: under, fill: palette.text, minContrast: 4.5, align},
      );
    }
  });
}

registerComposition({name: 'staircase', weight: 2, render});
