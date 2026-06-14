/**
 * Diagonal split: the canvas is cleaved by a single bold diagonal into two
 * fields -- one a flat color plane, the other a generator texture. The headline
 * runs along the diagonal at the same angle, reversed out of the field it
 * crosses. Tension and motion in the constructivist / rave-flyer mode.
 */
import {registerComposition} from '../core/registry.js';
import {Color, DesignContext} from '../core/types.js';
import {drawHeadline, drawLine} from '../typography/fitText.js';
import {
  displaySize,
  fillBackground,
  heavyWeight,
  isRtl,
  margin,
  regionFill,
  textBundle,
  textStyle,
} from './_composition.js';

function render(ctx: DesignContext): void {
  const {rng, palette} = ctx;
  const {width: W, height: H} = ctx;

  // The diagonal runs from a point on the left edge to a point on the right
  // edge, tilted so the split is decisively off-balance.
  const leftY = H * rng.range(0.15, 0.45);
  const rightY = H * rng.range(0.55, 0.85);
  const goingDown = rng.chance(0.5);
  const y0 = goingDown ? leftY : rightY;
  const y1 = goingDown ? rightY : leftY;
  const angle = (Math.atan2(y1 - y0, W) * 180) / Math.PI;

  const fieldColor: Color = regionFill(ctx, rng);
  const baseColor = rng.chance(0.5) ? palette.background : palette.primary;
  fillBackground(ctx, baseColor);

  // Upper field: a solid bold plane. Lower field: a full generator texture.
  // Clip each to its half via a polygon.
  const upper = `0,0 ${W},0 ${W},${y1} 0,${y0}`;
  const lower = `0,${y0} ${W},${y1} ${W},${H} 0,${H}`;

  // Upper solid plane.
  ctx.root.appendChild(ctx.el('polygon', {points: upper, fill: fieldColor}));

  // Lower textured field: stamp a generator over the whole canvas, clipped to
  // the lower polygon so the texture becomes a large protagonist region.
  const clipId = `diag-${rng.int(0, 1e9)}`;
  const defs = ctx.el('defs');
  const clip = ctx.el('clipPath', {id: clipId});
  clip.appendChild(ctx.el('polygon', {points: lower}));
  defs.appendChild(clip);
  ctx.root.appendChild(defs);
  const texGroup = ctx.group();
  texGroup.setAttribute('clip-path', `url(#${clipId})`);
  ctx.fillRegion(ctx.bounds(), texGroup);

  // A crisp seam line emphasising the split.
  ctx.root.appendChild(
    ctx.el('line', {
      x1: 0,
      y1: y0,
      x2: W,
      y2: y1,
      stroke: palette.accent,
      'stroke-width': Math.max(2, Math.min(W, H) * 0.008),
    }),
  );

  const bundle = textBundle(ctx);
  if (!bundle) return;

  const rtl = isRtl(ctx);
  const m = margin(ctx, 0.05);

  // Headline runs ALONG the diagonal. Rotate a group about the seam's left
  // anchor and place a backed headline so it reads over either field.
  const cx = 0;
  const cy = (y0 + y1) / 2;
  const g = ctx.group();
  g.setAttribute('transform', `rotate(${angle.toFixed(3)} ${cx} ${cy})`);

  // In the rotated frame the baseline is horizontal at cy. Size big and let it
  // bleed, with a backing band on the accent for guaranteed contrast.
  const headStyle = textStyle(ctx, displaySize(ctx, rng.range(0.1, 0.15)), heavyWeight(ctx));
  drawHeadline(
    ctx,
    {x: m, y: cy - H * 0.07, w: W - m * 2, h: H * 0.14},
    bundle.headline,
    headStyle,
    {
      mode: 'bleed',
      backing: true,
      bg: palette.accent,
      align: rtl ? 'end' : 'start',
      parent: g,
    },
  );

  // Supporting label pinned to a corner of the solid plane, axis-aligned for a
  // grid anchor against the diagonal motion.
  const labelStyle = textStyle(ctx, displaySize(ctx, 0.028), heavyWeight(ctx));
  const lx = rtl ? W - m : m;
  drawLine(ctx, lx, m + displaySize(ctx, 0.028), `${bundle.sub} · ${bundle.label}`, labelStyle, {
    bg: fieldColor,
    fill: palette.text,
    anchor: rtl ? 'end' : 'start',
  });
}

registerComposition({name: 'diagonal-split', weight: 3, render});
