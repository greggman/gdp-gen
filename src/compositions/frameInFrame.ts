/**
 * Frame in frame: a set of nested rectangular frames zoom inward toward an
 * off-centre focal point, alternating bold flat color planes with generator
 * texture, until the innermost panel holds the type. Extreme concentric scale,
 * active asymmetry, and a generator field as protagonist -- museum-poster /
 * Albers-homage energy.
 */
import {registerComposition} from '../core/registry.js';
import {Color, DesignContext, Rect} from '../core/types.js';
import {drawHeadline} from '../typography/fitText.js';
import {
  block,
  fillBackground,
  heavyWeight,
  isRtl,
  regionFill,
  textBundle,
  textStyle,
} from './_composition.js';

/** Linear interpolation. */
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function render(ctx: DesignContext): void {
  const {rng, palette} = ctx;
  const {width: W, height: H} = ctx;

  // The focal point the frames converge on is pushed off-centre for tension.
  const fx = W * rng.range(0.3, 0.7);
  const fy = H * rng.range(0.32, 0.68);

  const baseColor: Color = regionFill(ctx, rng);
  const altColor: Color = baseColor === palette.primary ? palette.accent : palette.primary;
  fillBackground(ctx, rng.chance(0.5) ? baseColor : palette.background);

  // The outermost frame is the whole canvas; each successive frame is a smaller
  // rect sliding toward the focal point. 4-6 nested rings make a strong tunnel.
  const rings = rng.int(4, 6);
  // Which ring index gets the big generator texture (favour an outer-ish one so
  // the texture occupies a large region, never a tiny chip).
  const texRing = rng.int(0, Math.max(0, rings - 3));

  let cur: Rect = {x: 0, y: 0, w: W, h: H};
  const frames: Rect[] = [];
  for (let i = 0; i < rings; i++) {
    frames.push(cur);
    // Shrink toward the focal point by a confident factor.
    const k = rng.range(0.6, 0.74);
    const nw = cur.w * k;
    const nh = cur.h * k;
    // Anchor the new rect so it slides toward (fx, fy): the focal point keeps
    // the same relative position inside each frame.
    const rxFrac = (fx - cur.x) / cur.w;
    const ryFrac = (fy - cur.y) / cur.h;
    cur = {
      x: lerp(cur.x, cur.x + cur.w - nw, rxFrac),
      y: lerp(cur.y, cur.y + cur.h - nh, ryFrac),
      w: nw,
      h: nh,
    };
  }

  // Paint frames outermost-first so each smaller one sits on top, forming rings.
  frames.forEach((f, i) => {
    if (i === texRing) {
      ctx.fillRegion(f);
      return;
    }
    const c = i % 2 === 0 ? baseColor : altColor;
    block(ctx, f, c);
  });

  const inner = frames[frames.length - 1];
  const bundle = textBundle(ctx);
  if (!bundle) {
    // No text: fill the innermost panel with a second texture so the tunnel
    // terminates on a bold graphic core.
    ctx.fillRegion(inner);
    return;
  }

  // The innermost panel carries the type on a solid backing for contrast.
  const panelColor = (rings - 1) % 2 === 0 ? baseColor : altColor;
  // If the innermost ring is the texture ring, lay a solid plate behind text.
  const needsPlate = texRing === rings - 1;
  const plateColor: Color = needsPlate ? palette.background : panelColor;
  if (needsPlate) block(ctx, inner, plateColor);

  const rtl = isRtl(ctx);
  const align = rtl ? 'end' : 'middle';
  const pad = Math.min(inner.w, inner.h) * 0.08;
  const tf: Rect = {x: inner.x + pad, y: inner.y + pad, w: inner.w - pad * 2, h: inner.h - pad * 2};

  drawHeadline(
    ctx,
    {x: tf.x, y: tf.y, w: tf.w, h: tf.h * 0.62},
    bundle.headline,
    textStyle(ctx, Math.min(tf.w, tf.h) * 0.5, heavyWeight(ctx)),
    {bg: plateColor, fill: palette.text, minContrast: 4.5, align},
  );
  drawHeadline(
    ctx,
    {x: tf.x, y: tf.y + tf.h * 0.68, w: tf.w, h: tf.h * 0.3},
    `${bundle.sub} · ${bundle.label}`,
    textStyle(ctx, Math.min(tf.w, tf.h) * 0.14, heavyWeight(ctx)),
    {bg: plateColor, fill: palette.text, minContrast: 4.5, align},
  );
}

registerComposition({name: 'frame-in-frame', weight: 2, render});
