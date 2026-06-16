/**
 * Big type: an oversized headline set so large it bleeds off the edges, with a
 * small label tucked into a corner. The classic loud, type-as-image look of
 * techno covers and bold concert posters.
 */
import {registerComposition} from '../core/registry.js';
import {DesignContext} from '../core/types.js';
import {drawHeadlineFit, drawLine} from '../typography/fitText.js';
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

  // Set the headline so it FILLS the canvas: it wraps to as many huge lines as
  // needed and is sized to fill the box. This keeps type enormous and readable in
  // any aspect -- in a narrow portrait it stacks the words into big lines instead
  // of shrinking to fit the width (which would leave it tiny).
  const m = margin(ctx, 0.04);
  const weight = heavyWeight(ctx);
  const fill = bgIsColor ? palette.background : palette.primary;
  const align = rng.pick(['start', 'middle', 'end'] as const); // flush left / centered / right
  const bottomReserve = ctx.height * 0.08; // room for the corner label below
  drawHeadlineFit(
    ctx,
    {x: m, y: m, w: ctx.width - m * 2, h: ctx.height - m * 2 - bottomReserve},
    bundle.headline,
    textStyle(ctx, ctx.height, weight),
    {bg, fill, minContrast: 3, align},
  );

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
