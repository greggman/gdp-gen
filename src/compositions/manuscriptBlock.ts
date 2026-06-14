/**
 * Manuscript block (overhauled): a confident editorial spread, not a title page.
 * A dominant full-height generator sidebar (or top slab on tall canvases)
 * anchors one edge; the type field carries a giant display headline with a
 * reversed-out drop initial, an asymmetric measure, and a bold rule of color.
 * No text -> the page becomes a split of solid color and full-bleed texture.
 * Swiss/editorial boldness: extreme scale contrast, asymmetry, generator as
 * protagonist, type x graphic interaction, flat color blocking.
 */
import {registerComposition} from '../core/registry.js';
import {Color, DesignContext, Rect} from '../core/types.js';
import {GOLDEN, splitX, splitY} from '../layout/geometry.js';
import {drawHeadline, drawLine, drawParagraph} from '../typography/fitText.js';
import {
  block,
  displaySize,
  fillBackground,
  heavyWeight,
  isRtl,
  textBundle,
  textStyle,
} from './_composition.js';

function render(ctx: DesignContext): void {
  const {rng, palette} = ctx;
  fillBackground(ctx);

  const rtl = isRtl(ctx);
  const tall = ctx.height > ctx.width * 1.15;
  // Sidebar on the side opposite the reading flow on landscape; a top slab on
  // tall canvases. Generously sized so it is a protagonist, not an accent.
  const sideFrac = rng.range(0.3, 0.42);
  const full: Rect = {x: 0, y: 0, w: ctx.width, h: ctx.height};

  // Decide the textured "spine" region and the type region.
  let spine: Rect;
  let typeField: Rect;
  if (tall) {
    // Header slab across the full width.
    const [topSlab, body] = splitY(full, rng.range(0.3, 0.42));
    spine = topSlab;
    typeField = body;
  } else {
    // Full-height sidebar; place it on the leading edge for RTL, trailing else.
    const [left, right] = splitX(full, sideFrac);
    if (rtl) {
      spine = right;
      typeField = left;
    } else {
      spine = left;
      typeField = right;
    }
  }

  // The spine: a full generator texture (protagonist) with a bold color foot.
  ctx.fillRegion(spine);
  const footColor: Color = rng.chance(0.5) ? palette.primary : palette.accent;

  const bundle = textBundle(ctx);
  if (!bundle) {
    // No text: commit to bold color blocking + full-bleed texture. The spine is
    // already textured; flood the rest with a flat primary plane and cut one
    // confident diagonal accent bar across it.
    block(ctx, typeField, palette.primary);
    const barH = Math.min(typeField.w, typeField.h) * rng.range(0.12, 0.22);
    const cx = typeField.x + typeField.w / 2;
    const cy = typeField.y + typeField.h * rng.range(0.4, 0.7);
    const g = ctx.group();
    g.setAttribute('transform', `rotate(${rng.range(-18, 18)} ${cx} ${cy})`);
    block(
      ctx,
      {x: typeField.x - typeField.w, y: cy - barH / 2, w: typeField.w * 3, h: barH},
      palette.accent,
      g,
    );
    return;
  }

  const weight = heavyWeight(ctx);
  const anchor = rtl ? 'end' : 'start';
  const pad = Math.min(ctx.width, ctx.height) * 0.05;
  const tf: Rect = {
    x: typeField.x + pad,
    y: typeField.y + pad,
    w: typeField.w - pad * 2,
    h: typeField.h - pad * 2,
  };

  // --- Drop initial: an enormous reversed-out glyph sitting on a color block.
  const initial = Array.from(bundle.headline.replace(/\s+/g, ''))[0] ?? bundle.headline[0];
  const restHeadline = bundle.headline.slice(initial.length).trim() || bundle.headline;
  const initSize = Math.min(tf.h * 0.46, tf.w * 0.55);
  const initBoxW = initSize * 0.92;
  const initBoxH = initSize * 0.92;
  const initBoxX = rtl ? tf.x + tf.w - initBoxW : tf.x;
  const initBoxY = tf.y;
  block(ctx, {x: initBoxX, y: initBoxY, w: initBoxW, h: initBoxH}, footColor);
  drawHeadline(
    ctx,
    {x: initBoxX, y: initBoxY, w: initBoxW, h: initBoxH},
    initial,
    textStyle(ctx, initSize, weight),
    {bg: footColor, fill: palette.background, align: 'middle'},
  );

  // --- Headline remainder: large, stacked beside / under the initial, flush to
  // the asymmetric measure; allowed to bleed off the edge for tension.
  const restWords = restHeadline.split(/\s+/).filter(Boolean);
  const restLines = restWords.length >= 2 ? restWords : [restHeadline];
  const restTop = initBoxY + initBoxH * 0.18;
  const restX = rtl ? tf.x + tf.w - initBoxW - pad : initBoxX + initBoxW + pad * 0.6;
  const restW = rtl ? restX - tf.x : tf.x + tf.w - restX;
  const lineH = (initBoxH * 0.82) / restLines.length;
  const restStyle = textStyle(ctx, lineH * 0.86, weight);
  restLines.forEach((line, i) => {
    const y = restTop + lineH * (i + 0.5);
    drawLine(ctx, restX, y + restStyle.size * 0.3, line, restStyle, {
      bg: palette.background,
      fill: palette.text,
      anchor,
      minContrast: 3,
    });
  });

  // --- A confident full-measure rule of color under the head block.
  const ruleY = initBoxY + initBoxH + pad * 0.6;
  const ruleH = Math.max(4, ctx.height * 0.012);
  block(ctx, {x: tf.x, y: ruleY, w: tf.w, h: ruleH}, palette.accent);

  // --- Subtitle, reversed and bold, riding just below the rule.
  drawHeadline(
    ctx,
    {x: tf.x, y: ruleY + ruleH + pad * 0.3, w: tf.w, h: tf.h * 0.08},
    bundle.sub,
    textStyle(ctx, displaySize(ctx, 0.034), weight),
    {bg: palette.background, fill: palette.primary, align: anchor},
  );

  // --- Asymmetric body measure: narrower than the field, hung to the leading
  // edge so the negative space is a deliberate shape, not an even margin.
  const bodyY = ruleY + ruleH + pad * 0.3 + tf.h * 0.1;
  const bodyW = tf.w * rng.range(0.6, 0.78);
  const bodyX = rtl ? tf.x + tf.w - bodyW : tf.x;
  const bodyH = tf.y + tf.h - bodyY - tf.h * 0.06;
  if (bodyH > tf.h * 0.1) {
    drawParagraph(
      ctx,
      {x: bodyX, y: bodyY, w: bodyW, h: bodyH},
      bundle.body.join('  '),
      textStyle(ctx, displaySize(ctx, 0.021)),
      {bg: palette.background, fill: palette.text, anchor, lineHeight: 1.45},
    );
  }

  // --- Folio label reversed out of the spine's color foot.
  const fh = tall ? spine.h * 0.26 : spine.h * 0.12;
  const footRect: Rect = {x: spine.x, y: spine.y + spine.h - fh, w: spine.w, h: fh};
  block(ctx, footRect, footColor);
  drawHeadline(
    ctx,
    {x: footRect.x + pad * 0.5, y: footRect.y, w: footRect.w - pad, h: footRect.h},
    bundle.label,
    textStyle(ctx, displaySize(ctx, 0.03), weight),
    {bg: footColor, fill: palette.background, align: 'middle'},
  );
}

registerComposition({name: 'manuscript-block', weight: 2, render});
