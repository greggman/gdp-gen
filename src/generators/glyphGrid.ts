/**
 * Glyph grid: a regular lattice of single glyphs in the design's script, each
 * cell holding one centered character. Like a type specimen sheet or a phrasebook
 * spread used as wallpaper. Cells occasionally swap to the accent color or drop
 * out for negative space, giving the field rhythm without losing the grid.
 */
import {registerGenerator} from '../core/registry.js';
import {Color, DesignContext, Rect} from '../core/types.js';
import {makeWord} from '../typography/textgen.js';
import {scriptByName} from '../typography/scripts.js';
import {baseFill, clipped, palettePair, svgEl} from './_generator.js';

function render(ctx: DesignContext, bounds: Rect): SVGElement {
  const {rng, palette} = ctx;
  const {bg, fg} = palettePair(ctx, rng);
  const g = clipped(ctx, bounds);
  baseFill(g, bounds, bg);

  const script = scriptByName(ctx.text.script);
  const family = ctx.text.font.family;
  const weight = rng.pick([400, 700, 900]);

  const cols = rng.int(4, 10);
  const cw = bounds.w / cols;
  const rows = Math.max(2, Math.round(bounds.h / cw));
  const ch = bounds.h / rows;
  const size = Math.min(cw, ch) * rng.range(0.55, 0.78);

  // A small pool of glyphs keeps the field cohesive (one alphabet, repeated).
  const pool = Array.from(makeWord(rng, script) + makeWord(rng, script));
  const glyphs = pool.length ? pool : ['A'];
  const accent: Color = palette.accent;
  const dropout = rng.range(0, 0.18);

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (rng.chance(dropout)) continue;
      const cx = bounds.x + (c + 0.5) * cw;
      const cy = bounds.y + (r + 0.5) * ch + size * 0.35;
      const fill = rng.chance(0.12) ? accent : fg;
      const t = svgEl('text', {
        x: cx,
        y: cy,
        'font-family': family,
        'font-size': size.toFixed(1),
        'font-weight': weight,
        'text-anchor': 'middle',
        fill,
      });
      t.textContent = rng.pick(glyphs);
      g.appendChild(t);
    }
  }
  return g;
}

registerGenerator({name: 'glyph-grid', category: 'type', weight: 2, render});
