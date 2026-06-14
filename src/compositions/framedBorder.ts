/**
 * Framed border: a thick color frame wraps the canvas, enclosing an inner panel.
 * The frame may carry a generator texture; the panel holds the text (or another
 * texture when text is absent). The heavy enclosure recalls certificate plates,
 * ornamental gallery announcements, and boxed magazine covers.
 */
import {registerComposition} from '../core/registry.js';
import {DesignContext} from '../core/types.js';
import {inset} from '../layout/geometry.js';
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
  fillBackground(ctx);

  const border = Math.min(ctx.width, ctx.height) * rng.range(0.06, 0.11);

  // The frame: either a textured ring or a solid color band.
  const frameTextured = rng.chance(0.5);
  if (frameTextured) {
    ctx.fillRegion(ctx.bounds());
  } else {
    block(ctx, ctx.bounds(), regionFill(ctx, rng));
  }

  const panel = inset(ctx.bounds(), border);
  const weight = heavyWeight(ctx);

  const bundle = textBundle(ctx);
  if (!bundle) {
    // No text: the inner panel is a bold generator texture (a second texture,
    // distinct from the frame) with a heavy color bar slicing it for punch.
    ctx.fillRegion(panel);
    const barH = panel.h * rng.range(0.12, 0.2);
    block(
      ctx,
      {x: panel.x, y: panel.y + panel.h * rng.range(0.28, 0.6), w: panel.w, h: barH},
      rng.chance(0.5) ? palette.primary : palette.accent,
    );
    return;
  }

  // Inner panel as a BOLD field -- a generator texture or a heavy color plane,
  // never a blank certificate panel.
  const panelTextured = rng.chance(0.55);
  const fieldColor = rng.chance(0.5) ? palette.primary : palette.accent;
  if (panelTextured) ctx.fillRegion(panel);
  else block(ctx, panel, fieldColor);

  // A colossal headline reversed out of a heavy band straddling the panel.
  const m = Math.min(panel.w, panel.h) * 0.07;
  const bandColor = fieldColor === palette.primary ? palette.accent : palette.primary;
  const bandH = panel.h * rng.range(0.3, 0.4);
  const bandY = panel.y + panel.h * rng.range(0.18, 0.4);
  block(ctx, {x: panel.x, y: bandY, w: panel.w, h: bandH}, bandColor);
  const align = isRtl(ctx) ? 'end' : rng.pick(['start', 'middle'] as const);
  drawHeadline(
    ctx,
    {x: panel.x + m, y: bandY, w: panel.w - m * 2, h: bandH},
    bundle.headline,
    textStyle(ctx, bandH * 0.72, weight),
    {bg: bandColor, fill: palette.background, align, minContrast: 3, mode: 'shrink'},
  );

  // Sub + label on a small solid chip near the bottom of the panel.
  const subSize = Math.min(panel.w, panel.h) * 0.05;
  const chip = {
    x: panel.x + m,
    y: panel.y + panel.h - m - subSize * 1.9,
    w: panel.w - m * 2,
    h: subSize * 1.9,
  };
  block(ctx, chip, fieldColor);
  drawHeadline(
    ctx,
    chip,
    `${bundle.sub} · ${bundle.label}`,
    textStyle(ctx, subSize, weight),
    {bg: fieldColor, fill: palette.background, align: 'middle', minContrast: 3},
  );
}

registerComposition({name: 'framed-border', weight: 2, render});
