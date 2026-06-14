/**
 * Corner burst: a sunburst of alternating wedges radiates from one corner,
 * filling the whole canvas, with a generator texture stamped into a wide band
 * and a giant headline bleeding across it. Loud, optimistic, propaganda-poster /
 * rave-flyer energy with a hard diagonal pull from the corner anchor.
 */
import {registerComposition} from '../core/registry.js';
import {Color, DesignContext, Point, Rect} from '../core/types.js';
import {drawHeadline, drawLine} from '../typography/fitText.js';
import {
  block,
  displaySize,
  fillBackground,
  heavyWeight,
  isRtl,
  textBundle,
  textStyle,
} from './_composition.js';

function render(ctx: DesignContext): void {
  const {rng, palette} = ctx;
  const rtl = isRtl(ctx);

  // Pick a corner to burst from. RTL favours a right corner so the headline,
  // anchored end, reads away from the burst.
  const corners: Array<{x: number; y: number}> = [
    {x: 0, y: 0},
    {x: ctx.width, y: 0},
    {x: 0, y: ctx.height},
    {x: ctx.width, y: ctx.height},
  ];
  const corner = rtl ? rng.pick([corners[1], corners[3]]) : rng.pick(corners);

  // Two bold colors for the alternating rays.
  const cA: Color = palette.primary;
  const cB: Color = rng.chance(0.5) ? palette.accent : palette.background;
  fillBackground(ctx, cB);

  // Radius large enough to always cover the canvas from any corner.
  const R = Math.hypot(ctx.width, ctx.height) * 1.05;
  const burst = ctx.group();

  // Angular span the rays sweep: a full quarter-turn (90 deg) plus a little, so
  // the fan blankets the canvas regardless of aspect ratio. Determine the base
  // angle pointing into the canvas from this corner.
  const intoX = corner.x === 0 ? 1 : -1;
  const intoY = corner.y === 0 ? 1 : -1;
  const baseAngle = Math.atan2(intoY, intoX); // diagonal into the canvas
  const span = Math.PI / 2 + 0.25; // ~quarter circle, slight overshoot
  const start = baseAngle - span / 2;

  const rays = rng.int(9, 15) * 2; // even count so alternation closes cleanly
  const step = span / rays;
  for (let i = 0; i < rays; i++) {
    const a0 = start + i * step;
    const a1 = start + (i + 1) * step;
    const p0: Point = {x: corner.x + R * Math.cos(a0), y: corner.y + R * Math.sin(a0)};
    const p1: Point = {x: corner.x + R * Math.cos(a1), y: corner.y + R * Math.sin(a1)};
    if (i % 2 === 0) {
      burst.appendChild(
        ctx.el('path', {
          d: `M${corner.x} ${corner.y} L${p0.x} ${p0.y} L${p1.x} ${p1.y} Z`,
          fill: cA,
        }),
      );
    }
  }

  const bundle = textBundle(ctx);

  // A generator band cuts across the canvas as a second protagonist layer.
  const bandVertical = ctx.height >= ctx.width;
  const bandThick = (bandVertical ? ctx.height : ctx.width) * rng.range(0.28, 0.4);
  const band: Rect = bandVertical
    ? {x: 0, y: ctx.height * rng.range(0.34, 0.5), w: ctx.width, h: bandThick}
    : {x: 0, y: 0, w: ctx.width, h: 0};
  if (bandVertical) {
    band.y = Math.min(band.y, ctx.height - bandThick);
  } else {
    band.h = ctx.height;
    band.w = bandThick;
    band.x = ctx.width * rng.range(0.32, 0.5);
    band.x = Math.min(band.x, ctx.width - bandThick);
  }
  ctx.fillRegion(band);

  if (!bundle) {
    // No text: a bold solid disc at the corner hub anchors the burst.
    const hubR = Math.min(ctx.width, ctx.height) * rng.range(0.1, 0.18);
    burst.appendChild(
      ctx.el('circle', {cx: corner.x, cy: corner.y, r: hubR, fill: cB === palette.background ? palette.accent : palette.background}),
    );
    return;
  }

  const align = rtl ? 'end' : rng.chance(0.6) ? 'start' : 'middle';

  // EXTREME SCALE headline bleeding across, on a solid backing for contrast.
  const headBg: Color = palette.primary === cA ? palette.accent : palette.primary;
  drawHeadline(
    ctx,
    {
      x: ctx.width * 0.04,
      y: bandVertical ? band.y + band.h / 2 : ctx.height * 0.5,
      w: ctx.width * 0.92,
      h: bandVertical ? band.h : ctx.height * 0.3,
    },
    bundle.headline,
    textStyle(ctx, displaySize(ctx, rng.range(0.16, 0.24)), heavyWeight(ctx)),
    {mode: 'bleed', backing: true, bg: headBg, align},
  );

  // A small supporting label tucked in the corner opposite the burst hub, on a
  // solid chip so it stays readable over the rays.
  const oppX = corner.x === 0 ? ctx.width : 0;
  const oppY = corner.y === 0 ? ctx.height : 0;
  const m = Math.min(ctx.width, ctx.height) * 0.05;
  const labelStyle = textStyle(ctx, displaySize(ctx, 0.026), heavyWeight(ctx));
  const labelText = `${bundle.sub} · ${bundle.label}`;
  const chipH = labelStyle.size * 1.6;
  const chipW = ctx.width * 0.5;
  const chipX = oppX === 0 ? m : oppX - m - chipW;
  const chipY = oppY === 0 ? m : oppY - m - chipH;
  block(ctx, {x: chipX, y: chipY, w: chipW, h: chipH}, cB === palette.background ? palette.primary : palette.background);
  const chipColor = cB === palette.background ? palette.primary : palette.background;
  drawLine(
    ctx,
    rtl ? chipX + chipW - chipH * 0.3 : chipX + chipH * 0.3,
    chipY + chipH * 0.68,
    labelText,
    labelStyle,
    {bg: chipColor, anchor: rtl ? 'end' : 'start'},
  );
}

registerComposition({name: 'corner-burst', weight: 2, render});
