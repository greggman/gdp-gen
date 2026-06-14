/**
 * Stacked blocks: bold full-width color bands stacked down the canvas, each
 * holding a single line of large type reversed out of the band. One band is a
 * generator texture for contrast. Heavy, graphic, and rhythmic -- inspired by
 * stacked-typography concert posters and color-field record sleeves.
 */
import {registerComposition} from '../core/registry.js';
import {DesignContext} from '../core/types.js';
import {inset, rows} from '../layout/geometry.js';
import {drawHeadline} from '../typography/fitText.js';
import {
  block,
  fillBackground,
  heavyWeight,
  isRtl,
  textBundle,
  textStyle,
} from './_composition.js';

function render(ctx: DesignContext): void {
  const {rng, palette} = ctx;
  fillBackground(ctx);

  const rtl = isRtl(ctx);
  const align = rtl ? 'end' : rng.pick(['start', 'middle'] as const);
  const colors = [palette.primary, palette.accent, palette.colors[3] ?? palette.primary];

  const bundle = textBundle(ctx);
  if (!bundle) {
    // No text: pure stacked color/texture bands.
    const count = rng.int(4, 7);
    const bands = rows(ctx.bounds(), count);
    bands.forEach((b, i) => {
      if (rng.chance(0.4)) ctx.fillRegion(b);
      else block(ctx, b, colors[i % colors.length]);
    });
    return;
  }

  // Lines to stack: headline gets a taller band, others are uniform.
  const lines = [bundle.headline, bundle.sub, bundle.english ?? bundle.body[0] ?? bundle.sub, bundle.label];
  const count = lines.length;

  // Uneven band heights: headline band larger.
  const weights = [2.2, 1, 1, 0.9];
  const totalW = weights.reduce((a, b) => a + b, 0);
  // Pick one band index to render as a texture instead of solid color.
  const texBand = rng.int(0, count - 1);

  let y = 0;
  lines.forEach((line, i) => {
    const h = (ctx.height * weights[i]) / totalW;
    const band = {x: 0, y, w: ctx.width, h};
    y += h;

    const bandColor = colors[i % colors.length];
    let bg = bandColor;
    if (i === texBand) {
      ctx.fillRegion(band);
      // Text on texture needs a solid backing; use a centered backing block.
      bg = palette.background;
    } else {
      block(ctx, band, bandColor);
    }

    const pad = h * 0.16;
    const fontSize = i === 0 ? h * 0.6 : h * 0.5;
    drawHeadline(
      ctx,
      inset(band, h * 0.4, pad),
      line,
      textStyle(ctx, fontSize, heavyWeight(ctx)),
      i === texBand
        ? {mode: 'bleed', backing: true, bg, align}
        : {bg, fill: palette.background, align},
    );
  });
}

registerComposition({name: 'stacked-blocks', weight: 2, render});
