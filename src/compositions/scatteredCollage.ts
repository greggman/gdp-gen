/**
 * Scattered collage: rotated scraps of texture and text strewn across the
 * canvas like a pasted-up zine page. Each scrap is a small solid card carrying
 * either a generator swatch or a line of type, tilted at a jaunty angle.
 * Inspired by punk flyers, Dada cut-ups, and postmodern collage covers.
 */
import {registerComposition} from '../core/registry.js';
import {DesignContext} from '../core/types.js';
import {Rect} from '../core/types.js';
import {inset} from '../layout/geometry.js';
import {drawHeadline} from '../typography/fitText.js';
import {
  block,
  displaySize,
  fillBackground,
  heavyWeight,
  isRtl,
  textBundle,
  textStyle,
} from './_composition.js';

/** Wraps children in a rotated group about the scrap's center. */
function tilted(ctx: DesignContext, r: Rect, angle: number): SVGGElement {
  const g = ctx.group();
  g.setAttribute(
    'transform',
    `rotate(${angle.toFixed(1)} ${(r.x + r.w / 2).toFixed(1)} ${(r.y + r.h / 2).toFixed(1)})`,
  );
  return g;
}

function render(ctx: DesignContext): void {
  const {rng, palette} = ctx;
  fillBackground(ctx);

  const colors = [palette.primary, palette.accent, palette.colors[3] ?? palette.primary];
  const minDim = Math.min(ctx.width, ctx.height);

  // A few texture scraps regardless of text presence.
  const texScraps = rng.int(3, 5);
  for (let i = 0; i < texScraps; i++) {
    const w = minDim * rng.range(0.22, 0.42);
    const h = minDim * rng.range(0.18, 0.36);
    const r = {
      x: rng.range(-w * 0.1, ctx.width - w * 0.9),
      y: rng.range(-h * 0.1, ctx.height - h * 0.9),
      w,
      h,
    };
    const g = tilted(ctx, r, rng.range(-18, 18));
    // White paper border behind the swatch for that pasted-scrap feel.
    block(ctx, inset(r, -minDim * 0.012), palette.background, g);
    ctx.fillRegion(r, g);
  }

  const bundle = textBundle(ctx);
  if (!bundle) return; // Texture-only collage is visually complete.

  const rtl = isRtl(ctx);
  // Text scraps: solid cards with a tilted line of type.
  const lines: {text: string; size: number}[] = [
    {text: bundle.headline, size: 0.1},
    {text: bundle.sub, size: 0.05},
    {text: bundle.english ?? bundle.body[0] ?? bundle.sub, size: 0.045},
    {text: bundle.label, size: 0.06},
  ];

  lines.forEach((ln, i) => {
    const fontSize = displaySize(ctx, ln.size);
    const h = fontSize * 1.5;
    const w = ctx.width * rng.range(0.45, 0.85);
    const r = {
      x: rng.range(ctx.width * 0.03, ctx.width * 0.97 - w),
      y: ctx.height * (0.1 + i * 0.21) + rng.range(-ctx.height * 0.04, ctx.height * 0.04),
      w,
      h,
    };
    const cardColor = i === 0 ? palette.background : rng.pick(colors);
    const g = tilted(ctx, r, rng.range(-12, 12));
    block(ctx, r, cardColor, g);
    drawHeadline(
      ctx,
      inset(r, h * 0.18),
      ln.text,
      textStyle(ctx, fontSize, heavyWeight(ctx)),
      {bg: cardColor, fill: i === 0 ? palette.primary : palette.background, align: rtl ? 'end' : 'start', parent: g},
    );
  });
}

registerComposition({name: 'scattered-collage', weight: 2, render});
