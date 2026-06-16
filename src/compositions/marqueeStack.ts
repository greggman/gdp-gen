/**
 * Marquee stack: full-width horizontal bands stacked top to bottom, each one a
 * solid color, a generator texture, or a giant line of repeated/oversized text
 * that bleeds off both edges -- ticker-tape, scrolling-LED, airport-departures
 * energy. Extreme scale contrast between the headline band and the thin detail
 * rows.
 */
import {registerComposition} from '../core/registry.js';
import {Color, DesignContext, Rect} from '../core/types.js';
import {drawHeadline, drawHeadlineFit} from '../typography/fitText.js';
import {measureWidth} from '../typography/fitText.js';
import {
  block,
  displaySize,
  fillBackground,
  heavyWeight,
  isRtl,
  regionFill,
  textBundle,
  textStyle,
} from './_composition.js';

/** Repeats `text` enough times to overflow `width`, joined by a separator. */
function repeatToWidth(text: string, sep: string, width: number, style: ReturnType<typeof textStyle>): string {
  const unit = text + sep;
  const unitW = Math.max(1, measureWidth(unit, style));
  const times = Math.ceil(width / unitW) + 1;
  return new Array(times).fill(text).join(sep);
}

function render(ctx: DesignContext): void {
  const {rng, palette} = ctx;
  fillBackground(ctx);

  const bundle = textBundle(ctx);
  const weight = heavyWeight(ctx);

  if (!bundle) {
    // No text: pure stacked texture/color bands carry the rhythm.
    const n = rng.int(4, 7);
    let y = 0;
    for (let i = 0; i < n; i++) {
      const h = ctx.height * (i === rng.int(0, n - 1) ? rng.range(0.28, 0.4) : rng.range(0.07, 0.16));
      const band: Rect = {x: 0, y, w: ctx.width, h: Math.min(h, ctx.height - y)};
      if (rng.chance(0.6)) ctx.fillRegion(band);
      else block(ctx, band, i % 2 ? regionFill(ctx, rng) : palette.background);
      y += band.h;
      if (y >= ctx.height) break;
    }
    return;
  }

  const rtl = isRtl(ctx);
  const sep = '  /  ';

  // Build a band program: one giant headline band plus several supporting
  // bands. The headline band takes a dominant slice for extreme scale contrast.
  const heroFrac = rng.range(0.34, 0.46);
  const heroIndex = rng.int(1, 3);
  const supportCount = rng.int(4, 6);
  const supportFrac = (1 - heroFrac) / supportCount;

  const repeated = [bundle.sub, bundle.label, bundle.english ?? bundle.body[0] ?? bundle.sub, bundle.body[1] ?? bundle.label];

  let y = 0;
  let supportSeen = 0;
  const totalBands = supportCount + 1;
  for (let i = 0; i < totalBands; i++) {
    const isHero = i === heroIndex;
    const h = (isHero ? heroFrac : supportFrac) * ctx.height;
    const band: Rect = {x: 0, y, w: ctx.width, h};
    y += h;

    if (isHero) {
      // Giant headline filling the hero band on a bold color field. Fit-to-box so
      // it wraps to fill the band instead of bleeding off (and vanishing) when the
      // canvas is narrow.
      const heroBg: Color = rng.chance(0.5) ? palette.primary : palette.accent;
      block(ctx, band, heroBg);
      drawHeadlineFit(
        ctx,
        {x: ctx.width * 0.03, y: band.y + band.h * 0.06, w: ctx.width * 0.94, h: band.h * 0.88},
        bundle.headline,
        textStyle(ctx, band.h, weight),
        {bg: heroBg, fill: palette.background, align: rng.pick(['start', 'middle', 'end'] as const)},
      );
      continue;
    }

    // Supporting band: alternate textured marquee vs. solid repeated-text row.
    const textured = rng.chance(0.4);
    if (textured) {
      ctx.fillRegion(band);
      // A solid strip with one repeated phrase laid across it for legibility.
      const stripH = band.h * 0.6;
      const strip: Rect = {x: 0, y: band.y + (band.h - stripH) / 2, w: ctx.width, h: stripH};
      const stripBg = palette.background;
      block(ctx, strip, stripBg);
      const style = textStyle(ctx, strip.h * 0.62, weight);
      const phrase = repeated[supportSeen % repeated.length];
      const line = repeatToWidth(phrase, sep, ctx.width * 1.2, style);
      drawHeadline(ctx, {x: -ctx.width * 0.05, y: strip.y, w: ctx.width * 1.1, h: strip.h}, line, style, {
        mode: 'bleed',
        bg: stripBg,
        fill: palette.primary,
        align: rtl ? 'end' : 'start',
      });
    } else {
      const bandBg: Color = supportSeen % 2 ? palette.background : regionFill(ctx, rng);
      block(ctx, band, bandBg);
      const style = textStyle(ctx, band.h * rng.range(0.5, 0.66), weight);
      const phrase = repeated[supportSeen % repeated.length];
      const line = repeatToWidth(phrase, sep, ctx.width * 1.2, style);
      drawHeadline(ctx, {x: -ctx.width * 0.05, y: band.y, w: ctx.width * 1.1, h: band.h}, line, style, {
        mode: 'bleed',
        bg: bandBg,
        fill: bandBg === palette.background ? palette.primary : palette.background,
        align: rtl ? 'end' : 'start',
      });
    }
    supportSeen++;
  }
}

registerComposition({name: 'marquee-stack', weight: 2, render});
