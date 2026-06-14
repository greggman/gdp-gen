/**
 * Symbol tiling: a single punctuation/ornament glyph (asterisk, plus, slash,
 * bullet) tiled edge to edge like a dingbat wallpaper or a typesetter's border
 * pattern. Alternating rows can rotate or swap to a second symbol, giving a
 * woven, op-art quality from pure type marks.
 */
import {registerGenerator} from '../core/registry.js';
import {DesignContext, Rect} from '../core/types.js';
import {baseFill, clipped, palettePair, svgEl} from './_generator.js';

const SYMBOLS = ['*', '+', '×', '/', '\\', '·', '•', '◦', '·', '※', '#', '~', '=', '∴', '°'];

function render(ctx: DesignContext, bounds: Rect): SVGElement {
  const {rng, palette} = ctx;
  const {bg, fg} = palettePair(ctx, rng);
  const g = clipped(ctx, bounds);
  baseFill(g, bounds, bg);

  const family = ctx.text.font.family;
  const weight = rng.pick([400, 700, 900]);
  const primary = rng.pick(SYMBOLS);
  const secondary = rng.chance(0.6) ? rng.pick(SYMBOLS) : primary;
  const checker = rng.chance(0.5);

  const cols = rng.int(6, 16);
  const cw = bounds.w / cols;
  const rows = Math.max(2, Math.round(bounds.h / cw));
  const ch = bounds.h / rows;
  const size = Math.min(cw, ch) * rng.range(0.7, 1.05);
  const rowRotate = rng.chance(0.4);

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cx = bounds.x + (c + 0.5) * cw;
      const cy = bounds.y + (r + 0.5) * ch;
      const odd = (r + c) % 2 === 1;
      const sym = checker && odd ? secondary : primary;
      const fill = checker && odd ? palette.accent : fg;
      const rot = rowRotate && r % 2 === 1 ? 45 : 0;
      const t = svgEl('text', {
        x: cx,
        y: (cy + size * 0.34).toFixed(1),
        'font-family': family,
        'font-size': size.toFixed(1),
        'font-weight': weight,
        'text-anchor': 'middle',
        fill,
        transform: rot ? `rotate(${rot} ${cx} ${cy})` : '',
      });
      t.textContent = sym;
      g.appendChild(t);
    }
  }
  return g;
}

registerGenerator({name: 'symbol-tiling', category: 'type', weight: 2, render});
