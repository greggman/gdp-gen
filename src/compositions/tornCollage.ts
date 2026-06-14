/**
 * Torn collage: big rough-edged scraps of generator texture, rotated and
 * layered like ripped paper pasted onto a poster. Each scrap is a jagged polygon
 * (torn deckle edge) clipping a generator fill, dropped at a tilt with a paper
 * underlay. One large headline slams across the pile on a solid backing band,
 * with a couple of supporting scraps of type. Punk/Dada cut-up energy: the
 * scraps are LARGE protagonists, not confetti.
 */
import {registerComposition} from '../core/registry.js';
import {Color, DesignContext, Rect} from '../core/types.js';
import {inset} from '../layout/geometry.js';
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

/** Builds a jagged torn-edge polygon point string for a rect. */
function tornPoints(ctx: DesignContext, r: Rect): string {
  const {rng} = ctx;
  const jag = Math.min(r.w, r.h) * 0.06; // tear amplitude
  const pts: string[] = [];
  const push = (x: number, y: number) => pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  const stepsX = 7;
  const stepsY = 5;
  // Top edge (left -> right)
  for (let i = 0; i <= stepsX; i++) {
    const x = r.x + (r.w * i) / stepsX;
    push(x, r.y + rng.range(0, jag));
  }
  // Right edge (top -> bottom)
  for (let i = 1; i <= stepsY; i++) {
    const y = r.y + (r.h * i) / stepsY;
    push(r.x + r.w - rng.range(0, jag), y);
  }
  // Bottom edge (right -> left)
  for (let i = stepsX - 1; i >= 0; i--) {
    const x = r.x + (r.w * i) / stepsX;
    push(x, r.y + r.h - rng.range(0, jag));
  }
  // Left edge (bottom -> top)
  for (let i = stepsY - 1; i >= 1; i--) {
    const y = r.y + (r.h * i) / stepsY;
    push(r.x + rng.range(0, jag), y);
  }
  return pts.join(' ');
}

/** Wraps a rotation transform group about a rect's center. */
function tilted(ctx: DesignContext, r: Rect, angle: number, parent?: SVGElement): SVGGElement {
  const g = ctx.group(parent);
  g.setAttribute(
    'transform',
    `rotate(${angle.toFixed(2)} ${(r.x + r.w / 2).toFixed(1)} ${(r.y + r.h / 2).toFixed(1)})`,
  );
  return g;
}

/** Drops one large torn scrap of generator texture, tilted, with a paper edge. */
function tornScrap(ctx: DesignContext, r: Rect, angle: number, paper: Color): void {
  const g = tilted(ctx, r, angle);
  const pts = tornPoints(ctx, inset(r, Math.min(r.w, r.h) * 0.04));
  // Paper underlay: a slightly larger torn shape so the deckle edge shows.
  g.appendChild(ctx.el('polygon', {points: pts, fill: paper}));
  // Clip the generator texture to a torn polygon for the ripped-paper look.
  const clipId = `torn-${ctx.rng.int(0, 1e9)}`;
  const defs = ctx.el('defs');
  const clip = ctx.el('clipPath', {id: clipId});
  clip.appendChild(ctx.el('polygon', {points: pts}));
  defs.appendChild(clip);
  g.appendChild(defs);
  const texG = ctx.group(g);
  texG.setAttribute('clip-path', `url(#${clipId})`);
  ctx.fillRegion(inset(r, -Math.min(r.w, r.h) * 0.02), texG);
}

function render(ctx: DesignContext): void {
  const {rng, palette} = ctx;
  const {width: W, height: H} = ctx;
  // Base is a bold flat plane, not blank white, so scraps tear out of color.
  fillBackground(ctx, rng.chance(0.5) ? palette.primary : palette.background);

  const minDim = Math.min(W, H);
  const paper = palette.background;

  // A big anchor scrap covering a large off-centre region (a true protagonist).
  const anchorW = W * rng.range(0.55, 0.78);
  const anchorH = H * rng.range(0.55, 0.78);
  const anchor: Rect = {
    x: rng.range(-W * 0.08, W - anchorW * 0.85),
    y: rng.range(-H * 0.08, H - anchorH * 0.85),
    w: anchorW,
    h: anchorH,
  };
  tornScrap(ctx, anchor, rng.range(-10, 10), paper);

  // Two or three medium scraps layered over/around it at varied tilts.
  const extra = rng.int(2, 3);
  for (let i = 0; i < extra; i++) {
    const w = minDim * rng.range(0.34, 0.5);
    const h = minDim * rng.range(0.3, 0.46);
    const r: Rect = {
      x: rng.range(-w * 0.15, W - w * 0.8),
      y: rng.range(-h * 0.15, H - h * 0.8),
      w,
      h,
    };
    tornScrap(ctx, r, rng.range(-22, 22), paper);
  }

  const bundle = textBundle(ctx);
  if (!bundle) return; // Layered torn texture is complete on its own.

  const rtl = isRtl(ctx);
  const weight = heavyWeight(ctx);
  const m = margin(ctx, 0.05);

  // Supporting type scraps: small tilted solid cards, placed first so the
  // headline sits on top.
  const cardColor = rng.pick([palette.accent, palette.primary]);
  const subLines = [bundle.sub, bundle.english ?? bundle.body[0] ?? bundle.label];
  subLines.forEach((text, i) => {
    const fontSize = displaySize(ctx, i === 0 ? 0.05 : 0.038);
    const ch = fontSize * 1.6;
    const cw = W * rng.range(0.4, 0.62);
    const cr: Rect = {
      x: rng.range(W * 0.04, W * 0.96 - cw),
      y: (i === 0 ? H * rng.range(0.06, 0.2) : H * rng.range(0.72, 0.86)),
      w: cw,
      h: ch,
    };
    const col: Color = i === 0 ? cardColor : palette.background;
    const g = tilted(ctx, cr, rng.range(-9, 9));
    block(ctx, cr, col, g);
    drawHeadline(
      ctx,
      inset(cr, ch * 0.2),
      text,
      textStyle(ctx, fontSize, weight),
      {bg: col, fill: i === 0 ? palette.background : palette.primary, align: rtl ? 'end' : 'start', parent: g},
    );
  });

  // The headline: enormous, bleeding across the pile on a solid backing band,
  // tilted slightly against the scraps for tension.
  const hr: Rect = {x: m, y: H * rng.range(0.38, 0.52), w: W - m * 2, h: H * 0.2};
  const hg = tilted(ctx, hr, rng.range(-6, 6));
  drawHeadline(
    ctx,
    {x: hr.x, y: hr.y, w: hr.w, h: hr.h},
    bundle.headline,
    textStyle(ctx, displaySize(ctx, rng.range(0.15, 0.22)), weight),
    {mode: 'bleed', backing: true, bg: palette.primary, align: rtl ? 'end' : rng.pick(['start', 'middle'] as const), parent: hg},
  );
}

registerComposition({name: 'torn-collage', weight: 2, render});
