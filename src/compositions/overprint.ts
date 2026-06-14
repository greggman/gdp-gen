/**
 * Overprint: two deliberately misregistered risograph-style layers. A large
 * generator texture is stamped twice with a small offset in two spot colors,
 * and an oversized headline is printed once in solid ink and again as a shifted
 * "ghost" outline -- the off-register look of two-color riso and screenprint.
 * Big scale, overlapping type and texture, bold color blocking.
 */
import {registerComposition} from '../core/registry.js';
import {Color, DesignContext, Rect} from '../core/types.js';
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
  const {width: W, height: H} = ctx;
  fillBackground(ctx, palette.background);

  // Two spot inks for the two passes.
  const inkA: Color = palette.primary;
  const inkB: Color = palette.accent;

  // Registration offset: a small, deliberate misalignment relative to the page.
  const off = Math.min(W, H) * rng.range(0.012, 0.03);
  const dir = rng.pick([
    {x: 1, y: 1},
    {x: -1, y: 1},
    {x: 1, y: -1},
    {x: -1, y: -1},
  ] as const);

  // A large texture region occupying most of the canvas (the protagonist),
  // pushed off-centre and printed twice with the registration shift between.
  const rw = W * rng.range(0.62, 0.82);
  const rh = H * rng.range(0.62, 0.82);
  const rx = rng.range(0, W - rw);
  const ry = rng.range(0, H - rh);
  const region: Rect = {x: rx, y: ry, w: rw, h: rh};

  // First pass tinted via a translucent ink plate behind it; second pass shifted.
  // We emulate riso overprint by laying a flat ink plane, the texture, then a
  // shifted second ink plane at reduced opacity so colors "multiply".
  const plate = ctx.group();
  block(ctx, region, inkA, plate);
  ctx.fillRegion(region, plate);

  const plate2 = ctx.group();
  plate2.setAttribute('transform', `translate(${(off * dir.x).toFixed(2)} ${(off * dir.y).toFixed(2)})`);
  plate2.setAttribute('opacity', '0.55');
  const tint = ctx.el('rect', {x: region.x, y: region.y, width: region.w, height: region.h, fill: inkB});
  plate2.appendChild(tint);
  ctx.fillRegion(region, plate2);

  const bundle = textBundle(ctx);
  if (!bundle) {
    // No text: a third shifted ink bar reinforces the off-register graphic.
    const barH = H * rng.range(0.1, 0.18);
    const by = H * rng.range(0.4, 0.7);
    block(ctx, {x: -off, y: by, w: W + off * 2, h: barH}, inkA);
    const g = ctx.group();
    g.setAttribute('transform', `translate(${(-off * dir.x * 2).toFixed(2)} ${(-off * dir.y * 2).toFixed(2)})`);
    g.setAttribute('opacity', '0.6');
    block(ctx, {x: -off, y: by, w: W + off * 2, h: barH}, inkB, g);
    return;
  }

  const rtl = isRtl(ctx);
  const align = rtl ? 'end' : rng.pick(['start', 'middle'] as const);
  const m = margin(ctx, 0.04);

  // Giant headline printed twice: a shifted ghost in inkB, then the solid inkA
  // pass on top. Both bleed across the canvas overlapping the texture, each on a
  // backing band for guaranteed contrast.
  const headStyle = textStyle(ctx, displaySize(ctx, rng.range(0.18, 0.26)), heavyWeight(ctx));
  const headRect: Rect = {x: m, y: H * rng.range(0.34, 0.5), w: W - m * 2, h: H * 0.2};

  const ghost = ctx.group();
  ghost.setAttribute('transform', `translate(${(off * dir.x * 1.6).toFixed(2)} ${(off * dir.y * 1.6).toFixed(2)})`);
  ghost.setAttribute('opacity', '0.7');
  drawHeadline(ctx, headRect, bundle.headline, headStyle, {
    mode: 'bleed',
    backing: true,
    bg: inkB,
    align,
    parent: ghost,
  });

  drawHeadline(ctx, headRect, bundle.headline, headStyle, {
    mode: 'bleed',
    backing: true,
    bg: inkA,
    align,
  });

  // A small misregistered label block anchors the page, also double-printed.
  const labelH = displaySize(ctx, 0.07);
  const labelRect: Rect = {x: m, y: H - labelH - m, w: W * 0.5, h: labelH};
  const lghost = ctx.group();
  lghost.setAttribute('transform', `translate(${(off * dir.x).toFixed(2)} ${(off * dir.y).toFixed(2)})`);
  lghost.setAttribute('opacity', '0.65');
  drawHeadline(ctx, labelRect, `${bundle.sub} · ${bundle.label}`, textStyle(ctx, labelH * 0.6, heavyWeight(ctx)), {
    mode: 'bleed',
    backing: true,
    bg: inkB,
    align: rtl ? 'end' : 'start',
    parent: lghost,
  });
  drawHeadline(ctx, labelRect, `${bundle.sub} · ${bundle.label}`, textStyle(ctx, labelH * 0.6, heavyWeight(ctx)), {
    mode: 'bleed',
    backing: true,
    bg: inkA,
    align: rtl ? 'end' : 'start',
  });
}

registerComposition({name: 'overprint', weight: 2, render});
