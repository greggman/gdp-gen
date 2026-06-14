/**
 * Data matrix: a dense grid of 0/1 glyphs (or solid blocks) suggesting a stream
 * of binary data or a machine-readable code.
 */
import {registerGenerator} from '../core/registry.js';
import {DesignContext, Rect} from '../core/types.js';
import {baseFill, clipped, palettePair, svgEl} from './_generator.js';

function render(ctx: DesignContext, bounds: Rect): SVGElement {
  const {rng} = ctx;
  const {bg, fg} = palettePair(ctx, rng);
  const g = clipped(ctx, bounds);
  baseFill(g, bounds, bg);

  const cols = rng.int(16, 38);
  const cell = bounds.w / cols;
  const rows = Math.max(1, Math.round(bounds.h / cell));
  const useGlyphs = rng.chance(0.5);

  if (useGlyphs) {
    const fontSize = cell * rng.range(0.8, 1.05);
    const text = svgEl('text', {
      x: bounds.x,
      y: bounds.y,
      fill: fg,
      'font-family': 'monospace',
      'font-size': fontSize.toFixed(2),
      'font-weight': '700',
    });
    for (let r = 0; r < rows; r++) {
      const ty = bounds.y + (r + 0.85) * cell;
      const span = svgEl('tspan', {x: bounds.x + cell * 0.15, y: ty.toFixed(1)});
      let line = '';
      for (let c = 0; c < cols; c++) {
        line += rng.chance(0.5) ? '1' : '0';
      }
      span.textContent = line.split('').join(' ');
      span.setAttribute('fill-opacity', rng.range(0.55, 1).toFixed(2));
      text.appendChild(span);
    }
    g.appendChild(text);
  } else {
    // Block-matrix variant: filled vs empty cells as one path.
    const pad = cell * 0.12;
    const s = cell - pad * 2;
    let d = '';
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (!rng.chance(0.5)) continue;
        const x = bounds.x + c * cell + pad;
        const y = bounds.y + r * cell + pad;
        d += `M${x.toFixed(1)} ${y.toFixed(1)}h${s.toFixed(1)}v${s.toFixed(1)}h${(-s).toFixed(1)}z`;
      }
    }
    g.appendChild(svgEl('path', {d, fill: fg}));
  }
  return g;
}

registerGenerator({name: 'data-matrix', category: 'techno', weight: 2, render});
