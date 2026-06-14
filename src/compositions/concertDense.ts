/**
 * Dense layered concert poster: a full-bleed generator base, a giant headline
 * bleeding across the middle, stacked supporting bands, and a clutter of small
 * detail lines at the bottom. Loud, maximalist gig-poster energy.
 */
import {registerComposition} from '../core/registry.js';
import {DesignContext} from '../core/types.js';
import {inset} from '../layout/geometry.js';
import {drawHeadline} from '../typography/fitText.js';
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
  fillBackground(ctx);

  // A dense base texture across the whole canvas.
  ctx.fillRegion(ctx.bounds());

  // A second offset texture band for layering depth.
  const bandTop = ctx.height * rng.range(0.1, 0.25);
  const bandH = ctx.height * rng.range(0.25, 0.4);
  ctx.fillRegion({x: 0, y: bandTop, w: ctx.width, h: bandH});

  const bundle = textBundle(ctx);
  if (!bundle) {
    // No text: stack a few accent bars for rhythm.
    const bars = rng.int(3, 6);
    for (let i = 0; i < bars; i++) {
      const y = ctx.height * (0.15 + i * 0.13);
      const h = ctx.height * rng.range(0.02, 0.05);
      block(
        ctx,
        {x: 0, y, w: ctx.width * rng.range(0.4, 1), h},
        i % 2 ? palette.accent : palette.primary,
      );
    }
    return;
  }

  const rtl = isRtl(ctx);
  const align = rtl ? 'end' : rng.pick(['start', 'middle'] as const);
  const m = margin(ctx, 0.05);

  // Giant bleeding headline through the middle, with a backing band.
  drawHeadline(
    ctx,
    {x: m, y: ctx.height * 0.36, w: ctx.width - m * 2, h: ctx.height * 0.2},
    bundle.headline,
    textStyle(ctx, displaySize(ctx, rng.range(0.16, 0.24)), heavyWeight(ctx)),
    {mode: 'bleed', backing: true, bg: palette.primary, align},
  );

  // Two stacked supporting bands above and below.
  const subBands = [
    {y: ctx.height * 0.22, text: bundle.sub, color: palette.accent},
    {y: ctx.height * 0.6, text: bundle.english ?? bundle.body[0] ?? bundle.sub, color: palette.background},
  ];
  for (const b of subBands) {
    drawHeadline(
      ctx,
      {x: m, y: b.y, w: ctx.width - m * 2, h: ctx.height * 0.08},
      b.text,
      textStyle(ctx, displaySize(ctx, rng.range(0.05, 0.08)), heavyWeight(ctx)),
      {mode: 'bleed', backing: true, bg: b.color, align},
    );
  }

  // Cluttered detail lines stamped in a solid footer block.
  const footH = ctx.height * 0.16;
  const foot = {x: 0, y: ctx.height - footH, w: ctx.width, h: footH};
  block(ctx, foot, palette.background);
  const inner = inset(foot, m, footH * 0.12);
  const detailLines = [...bundle.body, bundle.label].slice(0, 4);
  const rowH = inner.h / detailLines.length;
  detailLines.forEach((line, i) => {
    drawHeadline(
      ctx,
      {x: inner.x, y: inner.y + i * rowH, w: inner.w, h: rowH},
      line,
      textStyle(ctx, rowH * 0.62, heavyWeight(ctx)),
      {bg: palette.background, fill: palette.primary, minContrast: 4.5, align: rtl ? 'end' : 'start'},
    );
  });
}

registerComposition({name: 'concert-dense', weight: 2, render});
