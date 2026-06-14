/**
 * Masthead: a heavy newspaper/zine nameplate slams across the very top of the
 * canvas -- the headline set enormous and bled to both edges over a solid band,
 * with a thin metadata strip beneath it. The lower two thirds become a dense
 * multi-column field of supporting copy, broken by a generator texture panel for
 * a confident asymmetric front-page layout.
 */
import {registerComposition} from '../core/registry.js';
import {DesignContext, Rect} from '../core/types.js';
import {columns, inset, splitY} from '../layout/geometry.js';
import {drawHeadline, drawLine, drawParagraph} from '../typography/fitText.js';
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
  fillBackground(ctx);

  const rtl = isRtl(ctx);
  const heavy = heavyWeight(ctx);
  const bandColor = rng.chance(0.55) ? palette.primary : palette.text;

  const bundle = textBundle(ctx);
  if (!bundle) {
    // No text: a fat masthead band of texture across the top, the rest a second
    // texture field, divided by a hard accent rule.
    const headH = ctx.height * rng.range(0.26, 0.36);
    ctx.fillRegion({x: 0, y: 0, w: ctx.width, h: headH});
    block(ctx, {x: 0, y: headH, w: ctx.width, h: ctx.height * 0.02}, palette.accent);
    ctx.fillRegion({x: 0, y: headH + ctx.height * 0.02, w: ctx.width, h: ctx.height - headH});
    return;
  }

  // --- Masthead band: enormous nameplate bleeding to both edges. ---
  const headH = ctx.height * rng.range(0.24, 0.32);
  block(ctx, {x: 0, y: 0, w: ctx.width, h: headH}, bandColor);
  drawHeadline(
    ctx,
    {x: 0, y: headH * 0.5 - headH * 0.18, w: ctx.width, h: headH * 0.64},
    bundle.headline,
    textStyle(ctx, headH * 0.9, heavy),
    {mode: 'bleed', backing: false, bg: bandColor, fill: palette.background, align: 'middle'},
  );

  // Thin metadata strip under the nameplate (edition / label / sub), in caps.
  const stripY = headH * 0.86;
  const m = margin(ctx, 0.045);
  drawLine(
    ctx,
    rtl ? ctx.width - m : m,
    stripY,
    bundle.label,
    textStyle(ctx, displaySize(ctx, 0.022), heavy),
    {bg: bandColor, fill: palette.background, anchor: rtl ? 'end' : 'start'},
  );
  drawLine(
    ctx,
    rtl ? m : ctx.width - m,
    stripY,
    bundle.sub,
    textStyle(ctx, displaySize(ctx, 0.022), heavy),
    {bg: bandColor, fill: palette.background, anchor: rtl ? 'start' : 'end'},
  );

  // Hard accent rule sealing the masthead.
  block(ctx, {x: 0, y: headH, w: ctx.width, h: ctx.height * 0.012}, palette.accent);

  // --- Body region: dense columns with a generator panel taking one column. ---
  const bodyTop = headH + ctx.height * 0.012;
  const body: Rect = {x: 0, y: bodyTop, w: ctx.width, h: ctx.height - bodyTop};
  const inner = inset(body, m, m * 0.7);

  const landscape = ctx.width >= ctx.height;
  const nCols = landscape ? rng.int(3, 4) : rng.int(2, 3);
  const gap = inner.w * 0.03;
  const cols = columns(inner, nCols, gap);

  // One column (an outer one) becomes a tall generator texture protagonist.
  const texCol = rng.chance(0.5) ? 0 : nCols - 1;

  const subhead = bundle.english ?? bundle.sub;
  cols.forEach((col, i) => {
    if (i === texCol) {
      ctx.fillRegion(col);
      // Reverse a vertical-ish label out of a backing chip at the bottom.
      const chipH = col.h * 0.16;
      const chip: Rect = {x: col.x, y: col.y + col.h - chipH, w: col.w, h: chipH};
      block(ctx, chip, palette.accent);
      drawHeadline(
        ctx,
        inset(chip, col.w * 0.08, chipH * 0.18),
        bundle.label,
        textStyle(ctx, chipH * 0.4, heavy),
        {bg: palette.accent, fill: palette.background, align: rtl ? 'end' : 'start'},
      );
      return;
    }

    // Lead column carries a bold standfirst; the rest carry running body copy.
    let y = col.y;
    if (i === (texCol === 0 ? 1 : 0)) {
      const shH = col.h * 0.22;
      drawHeadline(
        ctx,
        {x: col.x, y, w: col.w, h: shH * 0.6},
        subhead,
        textStyle(ctx, displaySize(ctx, 0.04), heavy),
        {bg: palette.background, fill: palette.primary, align: rtl ? 'end' : 'start'},
      );
      y += shH;
      block(ctx, {x: col.x, y: y - shH * 0.18, w: col.w, h: ctx.height * 0.006}, palette.text);
    }

    const copy = bundle.body.concat(bundle.body).join('  ');
    drawParagraph(
      ctx,
      {x: col.x, y, w: col.w, h: col.y + col.h - y},
      copy,
      textStyle(ctx, displaySize(ctx, 0.016)),
      {bg: palette.background, fill: palette.text, anchor: rtl ? 'end' : 'start', lineHeight: 1.35},
    );
  });
}

registerComposition({name: 'masthead', weight: 2, render});
