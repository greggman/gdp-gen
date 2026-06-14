/**
 * Character rain: vertical columns of single glyphs falling top to bottom, each
 * column with its own slight offset, spacing and fade -- the digital-rain /
 * datamosh look of late-90s techno sleeves. Columns sit on a fixed grid so the
 * field stays legible as texture, while per-column jitter keeps it alive.
 */
import {registerGenerator} from '../core/registry.js';
import {DesignContext, Rect} from '../core/types.js';
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

  const cols = rng.int(8, 22);
  const cw = bounds.w / cols;
  const size = cw * rng.range(0.7, 0.95);
  const lineH = size * rng.range(1.0, 1.35);
  const maxRows = Math.ceil(bounds.h / lineH) + 1;

  for (let c = 0; c < cols; c++) {
    const cx = bounds.x + (c + 0.5) * cw;
    const phase = rng.range(0, lineH);
    const weight = rng.pick([400, 700]);
    const head = rng.range(0, maxRows); // brightest glyph in this column
    const glyphs = Array.from(makeWord(rng, script) + makeWord(rng, script));
    const pool = glyphs.length ? glyphs : ['0'];
    for (let r = 0; r < maxRows; r++) {
      const cy = bounds.y - phase + r * lineH + size;
      const dist = Math.abs(r - head);
      const op = Math.max(0.18, 1 - dist * 0.12);
      const fill = dist < 0.5 ? palette.accent : fg;
      const t = svgEl('text', {
        x: cx,
        y: cy.toFixed(1),
        'font-family': family,
        'font-size': size.toFixed(1),
        'font-weight': weight,
        'text-anchor': 'middle',
        fill,
        'fill-opacity': op.toFixed(2),
      });
      t.textContent = pool[(r + c) % pool.length];
      g.appendChild(t);
    }
  }
  return g;
}

registerGenerator({name: 'char-rain', category: 'type', weight: 2, render});
