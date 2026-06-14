/**
 * Bold axial: a colossal centred headline that fills the width and bleeds off
 * the edges, set over a large generator field or a stack of heavy color blocks.
 * Extreme scale contrast (one giant element vs. tiny supporting marks) on a
 * deliberate central axis -- the museum-blockbuster / Blue Note look, not a
 * timid title page.
 */
import {registerComposition} from '../core/registry.js';
import {Color, DesignContext, Rect} from '../core/types.js';
import {splitY} from '../layout/geometry.js';
import {drawHeadline, fitSizeToWidth} from '../typography/fitText.js';
import {
  block,
  displaySize,
  fillBackground,
  heavyWeight,
  margin,
  regionFill,
  textBundle,
  textStyle,
} from './_composition.js';

function render(ctx: DesignContext): void {
  const {rng, palette} = ctx;
  const full = ctx.bounds();
  const weight = heavyWeight(ctx);

  const bundle = textBundle(ctx);
  if (!bundle) {
    // No text: TWO different generator textures (a full-bleed base and a big
    // centred panel) framed by a bold color border, so the design stays strong
    // even if one generator happens to render flat/low-contrast.
    fillBackground(ctx, palette.background);
    ctx.fillRegion(full);
    const bw = ctx.width * rng.range(0.46, 0.66);
    const bh = ctx.height * rng.range(0.42, 0.66);
    const bx = (ctx.width - bw) / 2;
    const by = (ctx.height - bh) / 2;
    const frame = Math.min(ctx.width, ctx.height) * rng.range(0.02, 0.04);
    block(ctx, {x: bx - frame, y: by - frame, w: bw + frame * 2, h: bh + frame * 2}, regionFill(ctx, rng));
    ctx.fillRegion({x: bx, y: by, w: bw, h: bh});
    // A thick accent bar bleeding across, off the centre axis, for punch.
    const barH = ctx.height * rng.range(0.05, 0.09);
    const barY = rng.chance(0.5) ? ctx.height * rng.range(0.08, 0.16) : ctx.height * rng.range(0.78, 0.88);
    block(ctx, {x: 0, y: barY, w: ctx.width, h: barH}, palette.accent);
    return;
  }

  // The headline is a single colossal lockup. Collapse multi-word headlines so
  // the whole thing reads as one enormous centred mark.
  const head = bundle.headline;

  // Two committed modes, both axial and loud:
  //  A) giant headline reversed out over a FULL-BLEED generator field;
  //  B) giant headline on a flat plane sandwiched by heavy color blocks.
  const overGenerator = rng.chance(0.55);

  if (overGenerator) {
    // A BOLD color field frames a big generator texture panel (so there is
    // always visible texture, even if the generator renders flat), and a heavy
    // headline band straddles it with a colossal reversed headline.
    const fieldColor: Color = rng.chance(0.5) ? palette.primary : palette.accent;
    fillBackground(ctx, fieldColor);
    const pad = margin(ctx, rng.range(0.05, 0.1));
    ctx.fillRegion({x: pad, y: pad, w: ctx.width - pad * 2, h: ctx.height - pad * 2});

    const bandColor: Color = fieldColor === palette.primary ? palette.accent : palette.primary;
    const m = margin(ctx, 0.03);
    const target = ctx.width - m * 2;
    const probe = textStyle(ctx, ctx.height, weight);
    const bandH = ctx.height * rng.range(0.28, 0.4);
    const bandY = ctx.height * rng.range(0.3, 0.5) - bandH / 2;
    block(ctx, {x: 0, y: bandY, w: ctx.width, h: bandH}, bandColor);

    // Colossal headline filling ~the full width, bleeding off both edges.
    const size = Math.min(bandH * 0.86, fitSizeToWidth(head, target * 1.04, probe, 8));
    const style = {...textStyle(ctx, size, weight), letterSpacing: -size * 0.02};
    drawHeadline(
      ctx,
      {x: 0, y: bandY, w: ctx.width, h: bandH},
      head,
      style,
      {bg: bandColor, fill: palette.background, align: 'middle', mode: 'bleed'},
    );

    // Sub + label on a small solid chip so they read over the texture panel.
    const subSize = displaySize(ctx, 0.026);
    const chip: Rect = {x: m, y: bandY + bandH + ctx.height * 0.03, w: ctx.width - m * 2, h: subSize * 1.9};
    block(ctx, chip, fieldColor);
    drawHeadline(
      ctx,
      chip,
      `${bundle.sub} · ${bundle.label}`,
      textStyle(ctx, subSize, weight),
      {bg: fieldColor, fill: palette.background, align: 'middle'},
    );
    return;
  }

  // Mode B: heavy stacked color planes split the canvas, the giant headline
  // straddling the seam between two big flat fields.
  const bgPlane: Color = palette.background;
  fillBackground(ctx, bgPlane);
  const t = rng.range(0.42, 0.62);
  const [top, bottom] = splitY(full, t);
  const topColor: Color = rng.chance(0.5) ? palette.primary : palette.accent;
  const bottomColor: Color = topColor === palette.primary ? palette.accent : palette.primary;
  // One plane is a bold flat color, the OTHER a generator texture, so there's
  // always real texture (not just flat color planes). The textured plane's text
  // gets its own solid chip below for contrast.
  const textureTop = rng.chance(0.5);
  if (textureTop) ctx.fillRegion(top);
  else block(ctx, top, topColor);
  if (textureTop) block(ctx, bottom, bottomColor);
  else ctx.fillRegion(bottom);

  // The seam: the giant headline sits on a flat band of background straddling
  // it, so the reversed type has guaranteed contrast and the planes frame it.
  const m = margin(ctx, 0.03);
  const target = ctx.width - m * 2;
  const probe = textStyle(ctx, ctx.height, weight);
  const headH = ctx.height * 0.34;
  const headY = top.h - headH / 2;
  block(ctx, {x: 0, y: headY, w: ctx.width, h: headH}, bgPlane);
  const size = Math.min(headH * 0.82, fitSizeToWidth(head, target * 1.04, probe, 8));
  const style = {...textStyle(ctx, size, weight), letterSpacing: -size * 0.02};
  drawHeadline(
    ctx,
    {x: 0, y: headY, w: ctx.width, h: headH},
    head,
    style,
    {bg: bgPlane, fill: palette.text, align: 'middle', mode: 'bleed'},
  );

  // Sub on the top plane, label on the bottom plane. A textured plane gets a
  // small solid chip behind its text so the reversed type always reads.
  const subSize = displaySize(ctx, 0.026);
  const subChip: Rect = {x: m, y: top.h * 0.18, w: ctx.width - m * 2, h: subSize * 1.8};
  if (textureTop) block(ctx, subChip, topColor);
  drawHeadline(ctx, subChip, bundle.sub, textStyle(ctx, subSize, weight), {
    bg: topColor,
    fill: palette.background,
    align: 'middle',
  });

  const labelSize = displaySize(ctx, 0.022);
  const labelChip: Rect = {
    x: m,
    y: bottom.y + bottom.h - margin(ctx, 0.05) - labelSize * 1.4,
    w: ctx.width - m * 2,
    h: labelSize * 1.8,
  };
  if (!textureTop) block(ctx, labelChip, bottomColor);
  drawHeadline(ctx, labelChip, bundle.label, {...textStyle(ctx, labelSize, weight), letterSpacing: labelSize * 0.12}, {
    bg: bottomColor,
    fill: palette.background,
    align: 'middle',
  });
}

registerComposition({name: 'centered', weight: 2, render});
