/**
 * Horizontal bands, loud edition: the canvas is sliced into dramatically uneven
 * stacked bands -- a couple of thin accent rules against one or two enormous
 * dominant bands. Several bands are filled edge-to-edge by generator textures;
 * one giant headline bleeds across (or reverses out of) the dominant band, with
 * supporting bands offset and varied in width so it never reads as flat stripes.
 * Bold color blocking, extreme scale contrast, active asymmetry. Any aspect.
 */
import {registerComposition} from '../core/registry.js';
import {Color, DesignContext, Rect} from '../core/types.js';
import {drawHeadline, drawLine, measureWidth} from '../typography/fitText.js';
import {
  block,
  displaySize,
  fillBackground,
  heavyWeight,
  isRtl,
  margin,
  regionFill,
  textBundle,
  textStyle,
} from './_composition.js';

interface Band {
  rect: Rect;
  color: Color;
  textured: boolean;
}

/**
 * Builds an uneven set of band weights: a few thin slivers and one or two
 * dominant bands, never an even stack. Returns weights summing across `count`.
 */
function unevenWeights(ctx: DesignContext, count: number): number[] {
  const {rng} = ctx;
  const weights: number[] = [];
  for (let i = 0; i < count; i++) weights.push(rng.range(0.18, 0.5));
  // Pick one dominant band and blow it up; sometimes a second medium one.
  const dom = rng.int(0, count - 1);
  weights[dom] = rng.range(3.5, 6.5);
  if (count >= 4 && rng.chance(0.6)) {
    let second = rng.int(0, count - 1);
    if (second === dom) second = (second + 1) % count;
    weights[second] = rng.range(1.4, 2.6);
  }
  return weights;
}

function render(ctx: DesignContext): void {
  const {rng, palette} = ctx;
  fillBackground(ctx);

  const hasText = ctx.text.enabled;
  const count = rng.int(4, 7);
  const weights = unevenWeights(ctx, count);
  const total = weights.reduce((a, b) => a + b, 0);

  // Identify the dominant band (the headline goes here).
  let domIdx = 0;
  for (let i = 1; i < count; i++) if (weights[i] > weights[domIdx]) domIdx = i;

  // Offset some bands horizontally so edges break the grid; thin bands can be
  // partial-width accent rules pinned to one side.
  const bands: Band[] = [];
  let y = 0;
  for (let i = 0; i < count; i++) {
    const h = (weights[i] / total) * ctx.height;
    const isDom = i === domIdx;
    const isThin = h < ctx.height * 0.12;

    let rect: Rect = {x: 0, y, w: ctx.width, h};
    // Thin non-dominant bands sometimes shrink to a partial-width rule, pinned
    // left or right for asymmetric tension.
    if (isThin && !isDom && rng.chance(0.55)) {
      const w = ctx.width * rng.range(0.4, 0.82);
      const x = rng.chance(0.5) ? 0 : ctx.width - w;
      rect = {x, y, w, h};
    }

    const color = regionFill(ctx, rng);
    // Dominant band: usually solid (text reverses out) but can be textured with
    // a bleeding backing headline. Other bands lean heavily textured.
    const textured = isDom
      ? hasText
        ? rng.chance(0.4)
        : true
      : rng.chance(hasText ? 0.7 : 0.85);

    if (textured) {
      ctx.fillRegion(rect);
    } else {
      block(ctx, rect, color);
    }
    bands.push({rect, color, textured});
    y += h;
  }

  const bundle = textBundle(ctx);
  if (!bundle) {
    // No text: drop one full-width accent rule across the dominant band for an
    // extra bold horizon line.
    const d = bands[domIdx];
    const ry = d.rect.y + d.rect.h * rng.range(0.3, 0.7);
    block(
      ctx,
      {x: -2, y: ry, w: ctx.width + 4, h: ctx.height * rng.range(0.012, 0.03)},
      rng.chance(0.5) ? palette.accent : palette.primary,
    );
    return;
  }

  const rtl = isRtl(ctx);
  const align = rtl ? 'end' : rng.pick(['start', 'middle'] as const);
  const m = margin(ctx, 0.05);
  const dom = bands[domIdx];

  // GIANT headline across the dominant band. If textured, bleed with a backing
  // band on a solid color; if solid, reverse the type straight out of it.
  if (dom.textured) {
    drawHeadline(
      ctx,
      {x: m, y: dom.rect.y, w: ctx.width - m * 2, h: dom.rect.h},
      bundle.headline,
      textStyle(ctx, displaySize(ctx, rng.range(0.18, 0.28)), heavyWeight(ctx)),
      {mode: 'bleed', backing: true, bg: palette.primary, align},
    );
  } else {
    drawHeadline(
      ctx,
      {x: m, y: dom.rect.y, w: ctx.width - m * 2, h: dom.rect.h},
      bundle.headline,
      textStyle(ctx, displaySize(ctx, rng.range(0.16, 0.24)), heavyWeight(ctx)),
      {bg: dom.color, fill: palette.background, minContrast: 4.5, align},
    );
  }

  // Sub line tucked at one edge of the dominant band, small against the giant.
  const subSize = displaySize(ctx, 0.022);
  const subStyle = textStyle(ctx, subSize, heavyWeight(ctx));
  const subText = `${bundle.sub} · ${bundle.label}`;
  const subBg = dom.textured ? palette.primary : dom.color;
  const subFill = dom.textured ? palette.background : palette.background;
  const subY = dom.rect.y + dom.rect.h - subSize * 0.6;
  if (dom.textured) {
    // Backing strip so the small line stays readable over the texture.
    const sw = measureWidth(subText, subStyle);
    const pad = subSize * 0.4;
    const sx = rtl ? ctx.width - m - sw : m;
    block(
      ctx,
      {x: sx - pad, y: subY - subSize, w: sw + pad * 2, h: subSize * 1.5},
      palette.primary,
    );
  }
  drawLine(
    ctx,
    rtl ? ctx.width - m : m,
    subY,
    subText,
    subStyle,
    {bg: subBg, fill: subFill, minContrast: 4.5, anchor: rtl ? 'end' : 'start'},
  );

  // Place a second medium band (if any non-dominant band is tall enough and
  // solid) with a reversed body/english line for layered rhythm.
  const second = bands
    .map((b, i) => ({b, i}))
    .filter(o => o.i !== domIdx && !o.b.textured && o.b.rect.h > ctx.height * 0.1)
    .sort((a, c) => c.b.rect.h - a.b.rect.h)[0];
  if (second) {
    const text = bundle.english ?? bundle.body[0] ?? bundle.sub;
    drawHeadline(
      ctx,
      {x: second.b.rect.x + m, y: second.b.rect.y, w: second.b.rect.w - m * 2, h: second.b.rect.h},
      text,
      textStyle(ctx, displaySize(ctx, rng.range(0.05, 0.09)), heavyWeight(ctx)),
      {bg: second.b.color, fill: palette.background, minContrast: 4.5, align: rtl ? 'end' : 'start'},
    );
  }
}

registerComposition({name: 'horizontal-bands', weight: 2, render});
