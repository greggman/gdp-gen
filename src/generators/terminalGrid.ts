/**
 * Terminal grid: a monospace character grid filled with random glyphs at varied
 * opacity, like a busy terminal screen or ASCII readout.
 */
import {registerGenerator} from '../core/registry.js';
import {DesignContext, Rect} from '../core/types.js';
import {baseFill, clipped, palettePair, svgEl} from './_generator.js';

const GLYPHS = '#%&$@*+=-_/\\|<>[]{}01.:;'.split('');

function render(ctx: DesignContext, bounds: Rect): SVGElement {
  const {rng} = ctx;
  const {bg, fg} = palettePair(ctx, rng);
  const g = clipped(ctx, bounds);
  baseFill(g, bounds, bg);

  const cols = rng.int(20, 44);
  const cellW = bounds.w / cols;
  const cellH = cellW * rng.range(1.5, 1.9); // monospace cells are taller
  const rows = Math.max(1, Math.floor(bounds.h / cellH));
  const fontSize = cellH * 0.82;
  const density = rng.range(0.55, 0.85);

  const text = svgEl('text', {
    x: bounds.x,
    y: bounds.y,
    fill: fg,
    'font-family': 'monospace',
    'font-size': fontSize.toFixed(2),
    'xml:space': 'preserve',
  });

  for (let r = 0; r < rows; r++) {
    const ty = bounds.y + (r + 0.85) * cellH;
    const span = svgEl('tspan', {
      x: bounds.x + cellW * 0.1,
      y: ty.toFixed(1),
      'fill-opacity': rng.range(0.4, 1).toFixed(2),
    });
    let line = '';
    for (let c = 0; c < cols; c++) {
      line += rng.chance(density) ? rng.pick(GLYPHS) : ' ';
    }
    span.textContent = line;
    text.appendChild(span);
  }
  g.appendChild(text);
  return g;
}

registerGenerator({name: 'terminal-grid', category: 'techno', weight: 2, render});
