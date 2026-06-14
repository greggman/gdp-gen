/**
 * Golden spiral: the frame is recursively subdivided by the golden ratio into a
 * sequence of nested squares (the classic Fibonacci tiling). Each square holds a
 * generator texture or color block, sized in golden proportion, and the text is
 * placed in the small inner square at the spiral's eye. Echoes the proportion
 * systems behind classical poster and book design.
 */
import {registerComposition} from '../core/registry.js';
import {DesignContext, Rect} from '../core/types.js';
import {GOLDEN} from '../layout/geometry.js';
import {drawHeadline} from '../typography/fitText.js';
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

/**
 * Produces the nested golden-rectangle tiling: at each step a square is carved
 * off one side and the remainder is recursed. Returns the squares plus the final
 * small remainder (the spiral's eye).
 */
function spiralSquares(r: Rect, steps: number): {squares: Rect[]; eye: Rect} {
  const squares: Rect[] = [];
  let rect = r;
  // Cut direction cycles: left, top, right, bottom.
  for (let i = 0; i < steps; i++) {
    const horizontal = rect.w >= rect.h;
    const dir = i % 4;
    if (horizontal) {
      const s = rect.h;
      if (dir === 0) {
        squares.push({x: rect.x, y: rect.y, w: s, h: s});
        rect = {x: rect.x + s, y: rect.y, w: rect.w - s, h: rect.h};
      } else {
        squares.push({x: rect.x + rect.w - s, y: rect.y, w: s, h: s});
        rect = {x: rect.x, y: rect.y, w: rect.w - s, h: rect.h};
      }
    } else {
      const s = rect.w;
      if (dir === 1) {
        squares.push({x: rect.x, y: rect.y, w: s, h: s});
        rect = {x: rect.x, y: rect.y + s, w: rect.w, h: rect.h - s};
      } else {
        squares.push({x: rect.x, y: rect.y + rect.h - s, w: s, h: s});
        rect = {x: rect.x, y: rect.y, w: rect.w, h: rect.h - s};
      }
    }
  }
  return {squares, eye: rect};
}

function render(ctx: DesignContext): void {
  const {rng, palette} = ctx;
  fillBackground(ctx);

  // Start from a golden-proportioned rect centered in the frame so the tiling
  // reads cleanly on any aspect.
  const landscape = ctx.width >= ctx.height;
  let base: Rect;
  if (landscape) {
    const h = ctx.height;
    const w = Math.min(ctx.width, h * GOLDEN);
    base = {x: (ctx.width - w) / 2, y: 0, w, h};
  } else {
    const w = ctx.width;
    const h = Math.min(ctx.height, w * GOLDEN);
    base = {x: 0, y: (ctx.height - h) / 2, w, h};
  }
  // Fill any letterbox margins with a quiet texture so the frame is complete.
  if (base.w < ctx.width || base.h < ctx.height) ctx.fillRegion(ctx.bounds());

  const {squares, eye} = spiralSquares(base, rng.int(5, 7));

  squares.forEach((sq, i) => {
    // Larger squares get texture; smaller ones alternate to solid color.
    if (i < 2 || rng.chance(0.5)) {
      ctx.fillRegion(sq);
    } else {
      block(ctx, sq, regionFill(ctx, rng));
    }
  });

  const bundle = textBundle(ctx);
  if (!bundle) return;

  // Text lives on a solid panel at the spiral's eye, spilling slightly larger.
  const panelW = Math.max(eye.w, Math.min(ctx.width, ctx.height) * 0.4);
  const panelH = Math.max(eye.h, Math.min(ctx.width, ctx.height) * 0.22);
  const panel: Rect = {
    x: Math.min(eye.x, ctx.width - panelW),
    y: Math.min(eye.y, ctx.height - panelH),
    w: panelW,
    h: panelH,
  };
  block(ctx, panel, palette.background);

  const pad = Math.min(panel.w, panel.h) * 0.1;
  const inner = {x: panel.x + pad, y: panel.y + pad, w: panel.w - pad * 2, h: panel.h - pad * 2};
  const align = isRtl(ctx) ? 'end' : 'start';

  drawHeadline(
    ctx,
    {x: inner.x, y: inner.y, w: inner.w, h: inner.h * 0.6},
    bundle.headline,
    textStyle(ctx, displaySize(ctx, 0.055), heavyWeight(ctx)),
    {bg: palette.background, fill: palette.primary, align},
  );

  drawHeadline(
    ctx,
    {x: inner.x, y: inner.y + inner.h * 0.64, w: inner.w, h: inner.h * 0.32},
    `${bundle.sub} · ${bundle.label}`,
    textStyle(ctx, displaySize(ctx, 0.026), heavyWeight(ctx)),
    {bg: palette.background, fill: palette.accent, align},
  );
}

registerComposition({name: 'golden-spiral', weight: 2, render});
