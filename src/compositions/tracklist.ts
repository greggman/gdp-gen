/**
 * Tracklist: a CD / LP back-cover. One side is dominated by a giant stacked
 * album title sitting on a full-height generator texture; the other side is a
 * tight numbered list of made-up track titles set in a strict column, with big
 * index numerals doing the heavy lifting. Asymmetric split, extreme scale
 * contrast between the cover title and the fine print.
 */
import {registerComposition} from '../core/registry.js';
import {Color, DesignContext, Rect} from '../core/types.js';
import {GOLDEN, inset, splitX, splitY} from '../layout/geometry.js';
import {makePhrase} from '../typography/textgen.js';
import {scriptByName} from '../typography/scripts.js';
import {drawHeadline, drawLine, fitSizeToWidth, measureWidth} from '../typography/fitText.js';
import {
  block,
  displaySize,
  fillBackground,
  heavyWeight,
  isPortrait,
  isRtl,
  margin,
  regionFill,
  textBundle,
  textStyle,
} from './_composition.js';

function render(ctx: DesignContext): void {
  const {rng, palette} = ctx;
  fillBackground(ctx);

  const rtl = isRtl(ctx);
  // The cover-art side takes the larger golden share; list takes the rest. In
  // portrait we split TOP/BOTTOM (not side-by-side) so the track list spans the
  // full width and the titles have room to read -- a narrow side column would
  // squeeze them illegibly. In landscape we keep the classic side-by-side split.
  const full: Rect = {x: 0, y: 0, w: ctx.width, h: ctx.height};
  let artSide: Rect;
  let listSide: Rect;
  if (isPortrait(ctx)) {
    const artTop = rng.chance(0.6);
    const [top, bottom] = splitY(full, 1 / GOLDEN);
    artSide = artTop ? top : bottom;
    listSide = artTop ? bottom : top;
  } else {
    // Put the art on the leading edge half the time for variety.
    const artFirst = rtl ? rng.chance(0.3) : rng.chance(0.6);
    const [first, second] = splitX(full, 1 / GOLDEN);
    artSide = artFirst ? first : second;
    listSide = artFirst ? second : first;
  }

  // Full-height generator texture fills the art side -- generator as protagonist.
  ctx.fillRegion(artSide);

  const bundle = textBundle(ctx);
  if (!bundle) {
    // No text: throw a couple of bold bars across the list side for rhythm.
    block(ctx, listSide, regionFill(ctx, rng));
    const bars = rng.int(3, 5);
    for (let i = 0; i < bars; i++) {
      const y = listSide.y + listSide.h * (0.12 + i * 0.18);
      block(
        ctx,
        {x: listSide.x, y, w: listSide.w * rng.range(0.4, 0.95), h: listSide.h * 0.05},
        i % 2 ? palette.background : palette.accent,
      );
    }
    return;
  }

  const weight = heavyWeight(ctx);
  const align = rtl ? 'end' : 'start';
  const m = margin(ctx, 0.045);

  // Giant cover title stacked over the texture, on a solid backing band so it
  // stays legible regardless of what the generator drew.
  const titleColor: Color = regionFill(ctx, rng);
  const words = bundle.headline.split(/\s+/).filter(Boolean);
  const titleLines = words.length >= 2 ? words.slice(0, 3) : [bundle.headline];
  const bandH = artSide.h * Math.min(0.74, 0.2 * titleLines.length + 0.12);
  const bandY = artSide.y + artSide.h - bandH;
  block(ctx, {x: artSide.x, y: bandY, w: artSide.w, h: bandH}, titleColor);
  const titleArea = inset(
    {x: artSide.x, y: bandY, w: artSide.w, h: bandH},
    m,
    bandH * 0.06,
  );
  const lineH = titleArea.h / titleLines.length;
  titleLines.forEach((line, i) => {
    drawHeadline(
      ctx,
      {x: titleArea.x, y: titleArea.y + i * lineH, w: titleArea.w, h: lineH},
      line,
      textStyle(ctx, lineH * 0.96, weight),
      {bg: titleColor, fill: palette.background, minContrast: 3.5, align},
    );
  });

  // Numbered tracklist on the list side.
  const list = inset(listSide, m, m * 1.1);
  const script = scriptByName(ctx.text.script);
  const trackCount = rng.int(8, 12);

  // A small header label above the list.
  const headStyle = textStyle(ctx, displaySize(ctx, 0.022), weight);
  const headY = list.y + headStyle.size;
  drawLine(
    ctx,
    rtl ? list.x + list.w : list.x,
    headY,
    bundle.sub,
    {...headStyle, letterSpacing: headStyle.size * 0.06},
    {bg: palette.background, fill: palette.primary, anchor: align},
  );

  const top = headY + headStyle.size * 1.4;
  const rowH = (list.y + list.h - top) / trackCount;
  const numStyle = textStyle(ctx, rowH * 0.78, weight);
  const titleStyle = textStyle(ctx, rowH * 0.42, 400);
  // Reserve a numeral column from the ACTUAL widest 2-digit width plus a gap, so
  // the title never butts against (or overlaps) the number.
  const numCol = measureWidth('00', numStyle);
  const gap = rowH * 0.3;
  const titleMaxW = Math.max(rowH, list.w - numCol - gap);

  for (let i = 0; i < trackCount; i++) {
    const rowY = top + i * rowH;
    const baseline = rowY + rowH * 0.72;
    const num = String(i + 1).padStart(2, '0');
    const trackTitle = makePhrase(rng, script, {
      words: rng.int(1, 3),
      casing: 'title',
    });
    // Shrink long titles so they stay within the column and never overflow.
    const tStyle = {
      ...titleStyle,
      size: Math.min(titleStyle.size, fitSizeToWidth(trackTitle, titleMaxW, titleStyle, rowH * 0.3)),
    };
    if (rtl) {
      // Number flush right, title flowing left of the reserved numeral column.
      drawLine(ctx, list.x + list.w, baseline, num, numStyle, {
        bg: palette.background,
        fill: palette.accent,
        anchor: 'end',
      });
      drawLine(ctx, list.x + list.w - numCol - gap, baseline, trackTitle, tStyle, {
        bg: palette.background,
        fill: palette.text,
        anchor: 'end',
      });
    } else {
      drawLine(ctx, list.x, baseline, num, numStyle, {
        bg: palette.background,
        fill: palette.accent,
        anchor: 'start',
      });
      drawLine(ctx, list.x + numCol + gap, baseline, trackTitle, tStyle, {
        bg: palette.background,
        fill: palette.text,
        anchor: 'start',
      });
    }
    // Hairline rule under each track for the back-cover ledger feel.
    block(
      ctx,
      {x: list.x, y: rowY + rowH - 1, w: list.w, h: Math.max(1, rowH * 0.012)},
      palette.primary,
    );
  }
}

registerComposition({name: 'tracklist', weight: 2, render});
