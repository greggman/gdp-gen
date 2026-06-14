/**
 * Contour poster: a full-bleed generator texture stands in for a topographic /
 * contour map, and a single bold minimal title commands it. The whole canvas is
 * the generator (the protagonist); the type is one enormous confident element
 * placed off-centre, reversed out of a hard color field or bled across on a
 * solid backing band. Active negative space, extreme scale contrast, museum
 * blockbuster poster energy.
 */
import {registerComposition} from '../core/registry.js';
import {Color, DesignContext, Rect} from '../core/types.js';
import {splitX, splitY} from '../layout/geometry.js';
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

  // The contour texture fills the ENTIRE canvas -- protagonist. Force an actual
  // topographic/flowing-line generator (not a random one, which could be flat),
  // so the poster always reads as a contour map.
  const contourGen = rng.pick([
    'contour-lines',
    'topographic-relief',
    'concentric-circles',
    'nested-arcs',
    'line-wave-field',
    'waves',
    'concentric-hex',
    'water-ripple',
    'radial-lines',
  ]);
  ctx.fillRegion(ctx.bounds(), undefined, contourGen);

  const bundle = textBundle(ctx);
  if (!bundle) {
    // No text: punch one giant hard-edged color field through the contours for
    // bold blocking, then return.
    const horiz = W >= H;
    const t = rng.range(0.25, 0.45);
    const [a, b] = horiz ? splitX(ctx.bounds(), t) : splitY(ctx.bounds(), t);
    const field = rng.chance(0.5) ? a : b;
    block(ctx, field, rng.chance(0.5) ? palette.primary : palette.accent);
    return;
  }

  const rtl = isRtl(ctx);
  const weight = heavyWeight(ctx);
  const m = margin(ctx, 0.06);

  // A hard color field anchored to one edge gives the title a clean stage and
  // carves an asymmetric negative-space shape out of the contour field.
  const fieldColor: Color = rng.chance(0.5) ? palette.primary : palette.accent;
  const edge = rng.pick(['bottom', 'top', 'left'] as const);
  const tall = H >= W;

  if (edge === 'left' && !tall) {
    // Vertical color stripe on the leading edge; title runs big inside it.
    const sw = W * rng.range(0.32, 0.46);
    const x = rtl ? W - sw : 0;
    const field: Rect = {x, y: 0, w: sw, h: H};
    block(ctx, field, fieldColor);
    drawHeadline(
      ctx,
      {x: field.x + m * 0.6, y: H * 0.5 - H * 0.18, w: field.w - m * 1.2, h: H * 0.36},
      bundle.headline,
      textStyle(ctx, displaySize(ctx, rng.range(0.13, 0.18)), weight),
      {bg: fieldColor, fill: palette.background, align: rtl ? 'end' : 'start'},
    );
    drawLine(
      ctx,
      rtl ? field.x + field.w - m * 0.6 : field.x + m * 0.6,
      H - m,
      `${bundle.sub} · ${bundle.label}`,
      textStyle(ctx, displaySize(ctx, 0.026), weight),
      {bg: fieldColor, fill: palette.background, anchor: rtl ? 'end' : 'start'},
    );
    return;
  }

  // Horizontal band hugging the top or bottom edge.
  const bandH = H * rng.range(0.26, 0.36);
  const bandY = edge === 'top' ? 0 : H - bandH;
  const band: Rect = {x: 0, y: bandY, w: W, h: bandH};
  block(ctx, band, fieldColor);

  // One enormous title filling the band width, off-centre alignment for tension.
  const align = rtl ? 'end' : rng.pick(['start', 'middle'] as const);
  drawHeadline(
    ctx,
    {x: m, y: bandY + bandH * 0.08, w: W - m * 2, h: bandH * 0.62},
    bundle.headline,
    textStyle(ctx, displaySize(ctx, rng.range(0.16, 0.24)), weight),
    {mode: 'shrink', bg: fieldColor, fill: palette.background, align},
  );

  // A small supporting line tucked under the title inside the same band.
  drawLine(
    ctx,
    align === 'end' ? W - m : align === 'middle' ? W / 2 : m,
    bandY + bandH * 0.88,
    `${bundle.sub} — ${bundle.label}`,
    textStyle(ctx, displaySize(ctx, 0.028), weight),
    {bg: fieldColor, fill: palette.background, anchor: align},
  );
}

registerComposition({name: 'contour-poster', weight: 3, render});
