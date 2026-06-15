/**
 * Big type: an oversized headline set so large it bleeds off the edges, with a
 * small label tucked into a corner. The classic loud, type-as-image look of
 * techno covers and bold concert posters.
 */
import {registerComposition} from '../core/registry.js';
import {DesignContext} from '../core/types.js';
import {drawLine, fitSizeToWidth, measureWidth} from '../typography/fitText.js';
import {
  backdrop,
  displaySize,
  fillBackground,
  heavyWeight,
  margin,
  textBundle,
  textStyle,
} from './_composition.js';

function render(ctx: DesignContext): void {
  const {rng, palette} = ctx;
  const bgIsColor = rng.chance(0.5);
  fillBackground(ctx, bgIsColor ? palette.primary : palette.background);
  const bg = bgIsColor ? palette.primary : palette.background;

  const bundle = textBundle(ctx);
  if (!bundle) {
    // No text: a full-bleed generator carries it, with a couple of oversized
    // bars bleeding across for the bold big-type rhythm.
    ctx.fillRegion(ctx.bounds());
    const bars = rng.int(2, 4);
    for (let i = 0; i < bars; i++) {
      const y = ctx.height * rng.range(0.1, 0.85);
      ctx.root.appendChild(
        ctx.el('rect', {
          x: -20,
          y,
          width: ctx.width + 40,
          height: ctx.height * rng.range(0.04, 0.12),
          fill: i % 2 ? palette.accent : palette.primary,
        }),
      );
    }
    return;
  }

  // Optional muted backdrop texture so the field behind the type isn't flat.
  backdrop(ctx, 0.5);

  // Stack the headline words as huge lines, each overflowing the width.
  const words = bundle.headline.split(/\s+/).filter(Boolean);
  const lines = words.length >= 2 ? words : [bundle.headline];
  const m = margin(ctx, 0.04);
  const lineH = ctx.height / (lines.length + 0.4);
  const weight = heavyWeight(ctx);
  const fill = bgIsColor ? palette.background : palette.primary;

  lines.forEach((line, i) => {
    // Size so the word slightly overshoots the width -> intentional bleed.
    const probe = textStyle(ctx, ctx.height, weight);
    const target = ctx.width * rng.range(1.02, 1.25);
    const size = Math.min(lineH * 1.15, fitSizeToWidth(line, target, probe, 8));
    const style = textStyle(ctx, size, weight);
    const w = measureWidth(line, style);
    const x = rng.chance(0.5) ? m : ctx.width - m - w; // flush left or right
    const y = lineH * (i + 1);
    // x is the left edge of the line, so anchor at 'start' regardless of script.
    drawLine(ctx, x, y, line, style, {bg, fill, minContrast: 3, anchor: 'start'});
  });

  // Small label, corner-anchored bottom-left.
  drawLine(
    ctx,
    m,
    ctx.height - m,
    `${bundle.sub} · ${bundle.label}`,
    textStyle(ctx, displaySize(ctx, 0.022), weight),
    {bg, fill, anchor: 'start'},
  );
}

registerComposition({name: 'big-type', weight: 3, render});
