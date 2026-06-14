/**
 * Number grid: a dense matrix of random digit-strings, like a spreadsheet dump,
 * lottery sheet, or the data-readout aesthetic of technical/sci-fi posters.
 * Right-aligned cells in monospace-flavored weights give the columns a ledger
 * feel; a few cells are highlighted in the accent color like flagged values.
 */
import {registerGenerator} from '../core/registry.js';
import {DesignContext, Rect} from '../core/types.js';
import {baseFill, clipped, palettePair, svgEl} from './_generator.js';

function digits(rng: {int(a: number, b: number): number}, n: number): string {
  let s = '';
  for (let i = 0; i < n; i++) s += String(rng.int(0, 9));
  return s;
}

function render(ctx: DesignContext, bounds: Rect): SVGElement {
  const {rng, palette} = ctx;
  const {bg, fg} = palettePair(ctx, rng);
  const g = clipped(ctx, bounds);
  baseFill(g, bounds, bg);

  const family = ctx.text.font.family;
  const weight = rng.pick([400, 500, 700]);
  const cols = rng.int(4, 9);
  const cw = bounds.w / cols;
  const rows = Math.max(3, Math.round(bounds.h / (cw * rng.range(0.32, 0.5))));
  const ch = bounds.h / rows;
  const size = ch * rng.range(0.58, 0.78);
  const len = rng.int(2, 5);
  const pad = cw * 0.12;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (rng.chance(0.05)) continue;
      const x = bounds.x + (c + 1) * cw - pad;
      const y = bounds.y + (r + 0.5) * ch + size * 0.35;
      const flagged = rng.chance(0.08);
      const t = svgEl('text', {
        x: x.toFixed(1),
        y: y.toFixed(1),
        'font-family': family,
        'font-size': size.toFixed(1),
        'font-weight': flagged ? 800 : weight,
        'text-anchor': 'end',
        fill: flagged ? palette.accent : fg,
      });
      t.textContent = digits(rng, rng.chance(0.85) ? len : rng.int(1, len + 2));
      g.appendChild(t);
    }
  }
  return g;
}

registerGenerator({name: 'number-grid', category: 'type', weight: 2, render});
