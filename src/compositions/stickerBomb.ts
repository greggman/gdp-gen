/**
 * Sticker bomb: a dense scatter of overlapping rotated chips, each a
 * generator-filled "sticker" with a bold solid border, piled across the whole
 * canvas. One large hero sticker carries the headline; smaller ones carry the
 * sub and label. Maximalist skate/rave-flyer energy -- the texture IS the image.
 */
import {registerComposition} from '../core/registry.js';
import {DesignContext, Rect} from '../core/types.js';
import {rectPath} from '../layout/geometry.js';
import {drawHeadline} from '../typography/fitText.js';
import {
  displaySize,
  fillBackground,
  heavyWeight,
  isRtl,
  textBundle,
  textStyle,
} from './_composition.js';

function render(ctx: DesignContext): void {
  const {rng, palette} = ctx;
  // A loud flat ground so the chip borders pop.
  const groundColor = rng.chance(0.5) ? palette.primary : palette.background;
  fillBackground(ctx, groundColor);

  const minDim = Math.min(ctx.width, ctx.height);
  const borders = [palette.background, palette.primary, palette.accent, palette.text];

  // Scatter a pile of generator stickers across the whole canvas.
  const count = rng.int(9, 14);
  const uid = `sb${(ctx.rng.seed ?? 0).toString(36)}${rng.int(0, 1e6).toString(36)}`;
  for (let i = 0; i < count; i++) {
    const s = minDim * rng.range(0.22, 0.46);
    const w = s;
    const h = s * rng.range(0.7, 1.3);
    const r: Rect = {
      x: ctx.width * rng.range(-0.05, 0.85),
      y: ctx.height * rng.range(-0.05, 0.85),
      w,
      h,
    };
    const rot = rng.range(-28, 28);
    const cx = r.x + r.w / 2;
    const cy = r.y + r.h / 2;
    const g = ctx.group();
    g.setAttribute('transform', `rotate(${rot.toFixed(2)} ${cx.toFixed(1)} ${cy.toFixed(1)})`);
    ctx.root.appendChild(g);
    // Border = a slightly larger solid rect behind the textured fill.
    const bw = minDim * 0.012;
    const border = rng.pick(borders);
    g.appendChild(
      ctx.el('rect', {x: r.x - bw, y: r.y - bw, width: r.w + bw * 2, height: r.h + bw * 2, fill: border}),
    );
    const cid = `${uid}c${i}`;
    const clip = ctx.el('clipPath', {id: cid});
    clip.appendChild(ctx.el('path', {d: rectPath(r)}));
    const defs = ctx.el('defs');
    defs.appendChild(clip);
    g.appendChild(defs);
    const inner = ctx.group(g);
    inner.setAttribute('clip-path', `url(#${cid})`);
    ctx.fillRegion(r, inner);
  }

  const bundle = textBundle(ctx);
  if (!bundle) return;

  const rtl = isRtl(ctx);
  const align = rtl ? 'end' : 'start';
  const weight = heavyWeight(ctx);

  // Hero sticker: a big solid chip near center, tilted, headline reversed out.
  const hw = ctx.width * rng.range(0.62, 0.82);
  const hh = ctx.height * rng.range(0.2, 0.32);
  const hx = (ctx.width - hw) / 2 + ctx.width * rng.range(-0.08, 0.08);
  const hy = ctx.height * rng.range(0.32, 0.5);
  const heroRot = rng.range(-10, 10);
  const heroBg = rng.chance(0.5) ? palette.accent : palette.primary;
  const heroBorder = palette.background;
  const hcx = hx + hw / 2;
  const hcy = hy + hh / 2;
  const hg = ctx.group();
  hg.setAttribute('transform', `rotate(${heroRot.toFixed(2)} ${hcx.toFixed(1)} ${hcy.toFixed(1)})`);
  ctx.root.appendChild(hg);
  const hbw = minDim * 0.02;
  hg.appendChild(
    ctx.el('rect', {x: hx - hbw, y: hy - hbw, width: hw + hbw * 2, height: hh + hbw * 2, fill: heroBorder}),
  );
  hg.appendChild(ctx.el('rect', {x: hx, y: hy, width: hw, height: hh, fill: heroBg}));
  const pad = hh * 0.16;
  drawHeadline(
    ctx,
    {x: hx + pad, y: hy + pad, w: hw - pad * 2, h: hh - pad * 2},
    bundle.headline,
    textStyle(ctx, displaySize(ctx, rng.range(0.12, 0.18)), weight),
    {bg: heroBg, fill: palette.background, align: 'middle', parent: hg},
  );

  // A small label sticker tossed into a corner, opposite tilt.
  const lw = ctx.width * rng.range(0.26, 0.4);
  const lh = ctx.height * rng.range(0.08, 0.12);
  const lx = rng.chance(0.5) ? ctx.width * 0.04 : ctx.width * 0.96 - lw;
  const ly = rng.chance(0.5) ? ctx.height * 0.05 : ctx.height * 0.95 - lh;
  const lRot = rng.range(-18, 18);
  const lBg = rng.chance(0.5) ? palette.primary : palette.text;
  const lg = ctx.group();
  lg.setAttribute(
    'transform',
    `rotate(${lRot.toFixed(2)} ${(lx + lw / 2).toFixed(1)} ${(ly + lh / 2).toFixed(1)})`,
  );
  ctx.root.appendChild(lg);
  const lbw = minDim * 0.01;
  lg.appendChild(
    ctx.el('rect', {x: lx - lbw, y: ly - lbw, width: lw + lbw * 2, height: lh + lbw * 2, fill: palette.background}),
  );
  lg.appendChild(ctx.el('rect', {x: lx, y: ly, width: lw, height: lh, fill: lBg}));
  const lp = lh * 0.18;
  drawHeadline(
    ctx,
    {x: lx + lp, y: ly + lp, w: lw - lp * 2, h: lh - lp * 2},
    `${bundle.sub} · ${bundle.label}`,
    textStyle(ctx, displaySize(ctx, 0.03), weight),
    {bg: lBg, fill: palette.background, align, parent: lg},
  );
}

registerComposition({name: 'sticker-bomb', weight: 2, render});
