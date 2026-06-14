/**
 * Comic panels: the canvas is carved into a few irregular rectangular panels by
 * recursive splitting, divided by fat black gutters. Most panels are filled by
 * generator textures (the protagonists); one or two carry oversized headline
 * text reversed out of a bold color field, like a comic-book splash page. Loud,
 * graphic, asymmetric.
 */
import {registerComposition} from '../core/registry.js';
import {Color, DesignContext, Rect} from '../core/types.js';
import {inset, splitX, splitY} from '../layout/geometry.js';
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

/** Recursively splits a rect into `count` irregular panels. */
function carve(ctx: DesignContext, r: Rect, count: number): Rect[] {
  if (count <= 1) return [r];
  const {rng} = ctx;
  // Split along the longer axis most of the time so panels stay chunky.
  const vertical = r.w >= r.h ? rng.chance(0.78) : rng.chance(0.22);
  const t = rng.range(0.34, 0.66);
  const [a, b] = vertical ? splitX(r, t) : splitY(r, t);
  // Distribute the remaining panel budget unevenly between the halves.
  const left = Math.max(1, Math.round((count - 1) * rng.range(0.35, 0.65)));
  const right = count - left;
  return [...carve(ctx, a, left), ...carve(ctx, b, right)];
}

function render(ctx: DesignContext): void {
  const {rng, palette} = ctx;
  // Heavy ink background so the gutters read as fat black lines.
  const ink = palette.backgroundIsDark ? palette.background : palette.text;
  fillBackground(ctx, ink);

  const gutter = Math.min(ctx.width, ctx.height) * rng.range(0.02, 0.04);
  const count = rng.int(4, 6);
  const panels = carve(ctx, inset(ctx.bounds(), gutter * 0.5), count)
    // Inset each panel by half a gutter to open the black channels between them.
    .map(p => inset(p, gutter * 0.5));

  const bundle = textBundle(ctx);

  if (!bundle) {
    // No text: every panel is a generator -- a pure contact-sheet of textures.
    for (const p of panels) ctx.fillRegion(p);
    return;
  }

  const rtl = isRtl(ctx);
  const align = rtl ? 'end' : 'start';
  const weight = heavyWeight(ctx);

  // Pick the largest panel as the splash headline; a second one for the sub.
  const byArea = panels
    .map((p, i) => ({p, i, area: p.w * p.h}))
    .sort((x, y) => y.area - x.area);
  const headlineIdx = byArea[0].i;
  const subIdx = panels.length > 4 ? byArea[1].i : -1;

  panels.forEach((p, i) => {
    if (i === headlineIdx) {
      const fieldColor: Color = regionFill(ctx, rng);
      block(ctx, p, fieldColor);
      const pad = Math.min(p.w, p.h) * 0.08;
      // Clip the splash headline to its panel so its bleed stays inside the
      // frame instead of spilling across the gutters into adjacent panels.
      const clipId = `panel-${rng.int(1, 1e9)}`;
      const defs = ctx.el('defs');
      const cp = ctx.el('clipPath', {id: clipId});
      cp.appendChild(ctx.el('rect', {x: p.x, y: p.y, width: p.w, height: p.h}));
      defs.appendChild(cp);
      ctx.root.appendChild(defs);
      const clipped = ctx.group();
      clipped.setAttribute('clip-path', `url(#${clipId})`);
      drawHeadline(
        ctx,
        inset(p, pad),
        bundle.headline,
        textStyle(ctx, displaySize(ctx, rng.range(0.14, 0.22)), weight),
        {mode: 'bleed', backing: false, bg: fieldColor, fill: palette.background, align, parent: clipped},
      );
      return;
    }
    if (i === subIdx) {
      const fieldColor: Color = palette.background;
      block(ctx, p, fieldColor);
      const pad = Math.min(p.w, p.h) * 0.1;
      drawHeadline(
        ctx,
        inset(p, pad),
        rng.chance(0.5) ? bundle.sub : bundle.label,
        textStyle(ctx, displaySize(ctx, rng.range(0.05, 0.08)), weight),
        {bg: fieldColor, fill: palette.primary, minContrast: 4.5, align},
      );
      return;
    }
    // Everything else is a generator panel.
    ctx.fillRegion(p);
  });
}

registerComposition({name: 'comic-panels', weight: 2, render});
