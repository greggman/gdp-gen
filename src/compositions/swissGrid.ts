/**
 * Bolder Swiss / International Typographic Style: a strict column grid pushed
 * to full volume. One huge headline bleeds across the canvas, a dominant
 * generator panel claims multiple columns, and decisive flat color blocks slice
 * the grid asymmetrically. The grid still governs every edge -- but it shouts.
 */
import {registerComposition} from '../core/registry.js';
import {Color, DesignContext, Rect} from '../core/types.js';
import {columns, rows} from '../layout/geometry.js';
import {drawHeadline, drawLine, drawParagraph} from '../typography/fitText.js';
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

function render(ctx: DesignContext): void {
  const {rng, palette} = ctx;
  fillBackground(ctx);

  const m = margin(ctx, rng.range(0.045, 0.07));
  const content: Rect = {x: m, y: m, w: ctx.width - m * 2, h: ctx.height - m * 2};
  const colCount = rng.weighted([4, 6, 12], [3, 4, 2]);
  const gap = m * 0.35;
  const cols = columns(content, colCount, gap);
  const rtl = isRtl(ctx);
  const anchor = rtl ? 'end' : 'start';
  const weight = heavyWeight(ctx);
  const panelColor: Color = regionFill(ctx, rng);

  // --- Dominant generator panel: a wide band of multiple columns, anchored to
  // one side of the grid (asymmetry). It claims a third to two-thirds of the
  // canvas height and lives at top or bottom.
  const panelCols = rng.int(Math.ceil(colCount * 0.45), Math.max(2, colCount - 1));
  const panelStart = rtl ? colCount - panelCols : 0;
  const panelTopAnchored = rng.chance(0.5);
  const panelFrac = rng.range(0.34, 0.6);
  const panelH = content.h * panelFrac;
  const panelY = panelTopAnchored ? content.y : content.y + content.h - panelH;
  const lead = cols[panelStart];
  const trail = cols[panelStart + panelCols - 1];
  const panel: Rect = {
    x: lead.x,
    y: panelY,
    w: trail.x + trail.w - lead.x,
    h: panelH,
  };
  ctx.fillRegion(panel);

  const bundle = textBundle(ctx);
  if (!bundle) {
    // No text: a loud Swiss grid study. Fill the remaining columns with more
    // generator panels and slam down a couple of flat color bars across cells.
    const restCols = cols.filter((_, i) => i < panelStart || i >= panelStart + panelCols);
    const otherH = content.h - panelH - gap;
    const otherY = panelTopAnchored ? panelY + panelH + gap : content.y;
    for (const col of restCols) {
      if (rng.chance(0.55)) {
        ctx.fillRegion({x: col.x, y: otherY, w: col.w, h: otherH});
      } else {
        block(ctx, {x: col.x, y: otherY, w: col.w, h: otherH}, regionFill(ctx, rng));
      }
    }
    const barRows = rows(content, rng.int(5, 9), 0);
    for (let i = 0; i < 2; i++) {
      const r = rng.pick(barRows);
      block(
        ctx,
        {x: content.x, y: r.y, w: content.w, h: r.h},
        rng.chance(0.5) ? palette.primary : palette.accent,
      );
    }
    return;
  }

  // The text zone is the band of the canvas NOT covered by the panel.
  const textY = panelTopAnchored ? panel.y + panel.h + gap : content.y;
  const textH = content.h - panel.h - gap;

  // --- Giant numeral / glyph: a protagonist drawn from the label, set
  // enormous and reversed out against (or bleeding past) the panel edge for
  // extreme scale contrast. Placed off-centre on the panel's trailing side.
  const glyph = (bundle.label.match(/\d+/)?.[0] ?? bundle.label).slice(0, 3);
  const glyphSize = panel.h * rng.range(0.85, 1.05);
  const glyphStyle = textStyle(ctx, glyphSize, weight);
  const glyphPad = m * 0.4;
  const glyphX = rtl ? panel.x + glyphPad : panel.x + panel.w - glyphPad;
  const glyphY = panel.y + panel.h * 0.5 + glyphSize * 0.35;
  // Solid backing so the numeral always sits on a known color over the texture.
  drawLine(ctx, glyphX, glyphY, glyph, glyphStyle, {
    bg: panelColor,
    fill: palette.background,
    anchor: rtl ? 'start' : 'end',
    minContrast: 1.5,
  });

  // --- Huge headline filling the text zone, bleeding to the edges.
  const headStyle = textStyle(ctx, displaySize(ctx, rng.range(0.18, 0.26)), weight);
  drawHeadline(
    ctx,
    {x: content.x, y: textY, w: content.w, h: textH * 0.66},
    bundle.headline,
    headStyle,
    {
      mode: 'bleed',
      backing: true,
      bg: palette.background,
      fill: palette.primary,
      align: anchor,
      minContrast: 2,
    },
  );

  // --- Decisive color block: a flat accent bar slicing one edge of the text
  // zone, carrying the sub reversed out of it.
  const barH = Math.max(textH * 0.18, displaySize(ctx, 0.06));
  const barY = textY + textH - barH;
  const barColor: Color = panelColor === palette.accent ? palette.primary : palette.accent;
  // Span a sub-band of columns on the side opposite the panel glyph for tension.
  const barCols = rng.int(Math.ceil(colCount * 0.5), colCount);
  const barStart = rtl ? 0 : colCount - barCols;
  const bLead = cols[barStart];
  const bTrail = cols[barStart + barCols - 1];
  const bar: Rect = {x: bLead.x, y: barY, w: bTrail.x + bTrail.w - bLead.x, h: barH};
  block(ctx, bar, barColor);
  drawHeadline(
    ctx,
    {x: bar.x + m * 0.3, y: bar.y, w: bar.w - m * 0.6, h: bar.h},
    bundle.sub,
    textStyle(ctx, Math.min(displaySize(ctx, 0.05), bar.h * 0.55), weight),
    {bg: barColor, fill: palette.background, align: anchor, minContrast: 2},
  );

  // --- Body copy in a single grid column, flush to the leading edge, tucked
  // above the bar so the grid stays legible.
  const bodyCol = rtl ? cols[colCount - 1] : cols[0];
  const bodyTop = textY + textH * 0.68;
  if (barY - bodyTop > displaySize(ctx, 0.04)) {
    drawParagraph(
      ctx,
      {x: bodyCol.x, y: bodyTop, w: bodyCol.w, h: barY - bodyTop - gap},
      bundle.body.join('  '),
      textStyle(ctx, displaySize(ctx, 0.016)),
      {bg: palette.background, fill: palette.text, anchor},
    );
  }
}

registerComposition({name: 'swiss-grid', weight: 3, render});
