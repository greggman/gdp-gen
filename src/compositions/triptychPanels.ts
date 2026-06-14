/**
 * Triptych panels: the canvas is cleaved into three full-height vertical panels
 * of strongly contrasting fill -- a flat primary plane, a large generator
 * texture, and a flat accent (or background) plane. One huge headline either
 * bleeds across all three panels for type-x-graphic tension, or each panel
 * carries its own stacked word. Extreme scale contrast, bold color blocking,
 * and active asymmetry: the panel widths are intentionally uneven.
 */
import {registerComposition} from '../core/registry.js';
import {Color, DesignContext, Rect} from '../core/types.js';
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
  const {width: W, height: H} = ctx;
  fillBackground(ctx, palette.background);

  // Three uneven panels: pick a wide protagonist panel, two narrower flanks.
  // Weights normalized so the panel set always fills the width edge-to-edge.
  const wideIdx = rng.int(0, 2);
  const wWeights = [1, 1, 1];
  wWeights[wideIdx] = rng.range(1.8, 2.6);
  const total = wWeights[0] + wWeights[1] + wWeights[2];
  const widths = wWeights.map(w => (w / total) * W);
  const xs = [0, widths[0], widths[0] + widths[1]];
  const panels: Rect[] = widths.map((w, i) => ({x: xs[i], y: 0, w, h: H}));

  // The texture lives in the widest panel so the generator is a true
  // protagonist; the flanks are flat color planes.
  const texIdx = wideIdx;
  const flat: Color[] = rng.shuffle([palette.primary, palette.accent, palette.colors[3] ?? palette.primary]);
  let flatI = 0;
  panels.forEach((p, i) => {
    if (i === texIdx) {
      ctx.fillRegion(p);
    } else {
      block(ctx, p, flat[flatI++ % flat.length]);
    }
  });

  // A thin seam between panels for crisp constructivist edges.
  const seam = Math.max(2, Math.min(W, H) * 0.006);
  for (let i = 1; i < 3; i++) {
    block(ctx, {x: xs[i] - seam / 2, y: 0, w: seam, h: H}, palette.background);
  }

  const bundle = textBundle(ctx);
  if (!bundle) {
    // No text: punctuate the flat flanks with a few bold bars for rhythm.
    panels.forEach((p, i) => {
      if (i === texIdx) return;
      const bars = rng.int(2, 4);
      for (let b = 0; b < bars; b++) {
        const y = p.h * rng.range(0.12, 0.85);
        block(
          ctx,
          {x: p.x, y, w: p.w, h: H * rng.range(0.03, 0.08)},
          b % 2 ? palette.background : palette.accent,
        );
      }
    });
    return;
  }

  const rtl = isRtl(ctx);
  const weight = heavyWeight(ctx);
  const m = margin(ctx, 0.04);

  if (rng.chance(0.55)) {
    // MODE A: one enormous headline bleeding across the entire triptych,
    // rotated upright if the canvas is tall and narrow.
    const tall = H > W * 1.2;
    const g = ctx.group();
    if (tall) {
      // Rotate the headline to run vertically up the canvas.
      const cx = W / 2;
      const cy = H / 2;
      g.setAttribute('transform', `rotate(-90 ${cx} ${cy})`);
    }
    const longSide = tall ? H : W;
    drawHeadline(
      ctx,
      tall
        ? {x: (W - H) / 2 + m, y: (H - W) / 2 + H / 2 - W * 0.08, w: H - m * 2, h: W * 0.16}
        : {x: m, y: H * 0.5 - H * 0.11, w: W - m * 2, h: H * 0.22},
      bundle.headline,
      textStyle(ctx, longSide * rng.range(0.16, 0.22), weight),
      {mode: 'bleed', backing: true, bg: palette.background, align: rtl ? 'end' : 'middle', parent: g},
    );
    // Small supporting label pinned to the bottom of the wide texture panel.
    const tp = panels[texIdx];
    const labelH = H * 0.09;
    block(ctx, {x: tp.x, y: H - labelH, w: tp.w, h: labelH}, palette.background);
    drawHeadline(
      ctx,
      {x: tp.x + m * 0.5, y: H - labelH + labelH * 0.18, w: tp.w - m, h: labelH * 0.6},
      `${bundle.sub} · ${bundle.label}`,
      textStyle(ctx, displaySize(ctx, 0.026), weight),
      {bg: palette.background, fill: palette.primary, align: rtl ? 'end' : 'start'},
    );
    return;
  }

  // MODE B: one giant stacked word per panel, each reversed out of its field.
  const words = bundle.headline.split(/\s+/).filter(Boolean);
  const fills: string[] = [bundle.sub, bundle.headline, bundle.label];
  panels.forEach((p, i) => {
    const onTexture = i === texIdx;
    const fieldColor = onTexture ? palette.background : flat[(i < texIdx ? i : i - 1) % flat.length];
    // On the texture panel, lay a solid backing strip so the word reads.
    const word = words[i] ?? fills[i] ?? bundle.label;
    const stripH = H * rng.range(0.22, 0.34);
    const stripY = H * rng.range(0.1, 0.55);
    block(ctx, {x: p.x, y: stripY, w: p.w, h: stripH}, fieldColor);
    drawHeadline(
      ctx,
      {x: p.x + m * 0.5, y: stripY, w: p.w - m, h: stripH},
      word,
      textStyle(ctx, displaySize(ctx, 0.13), weight),
      {bg: fieldColor, fill: palette.primary, align: 'middle'},
    );
  });
  // A small footer line across the bottom, on a solid band.
  const footH = H * 0.08;
  block(ctx, {x: 0, y: H - footH, w: W, h: footH}, palette.primary);
  drawLine(
    ctx,
    rtl ? W - m : m,
    H - footH + footH * 0.66,
    `${bundle.sub} — ${bundle.label}`,
    textStyle(ctx, displaySize(ctx, 0.028), weight),
    {bg: palette.primary, fill: palette.background, anchor: rtl ? 'end' : 'start'},
  );
}

registerComposition({name: 'triptych-panels', weight: 3, render});
