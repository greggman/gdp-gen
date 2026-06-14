/**
 * Gradient grid: a grid of cells, each filled with its own two-color linear
 * gradient. Cell gradient angles vary smoothly across the grid so the whole
 * field has a coherent flow while each tile stays distinct.
 */
import {registerGenerator} from '../core/registry.js';
import {Color, DesignContext, Rect} from '../core/types.js';
import {baseFill, clipped, palettePair, svgEl} from './_generator.js';
import {uid} from '../core/renderer.js';

function render(ctx: DesignContext, bounds: Rect): SVGElement {
  const {rng, palette} = ctx;
  const {bg, fg} = palettePair(ctx, rng);
  const g = clipped(ctx, bounds);
  baseFill(g, bounds, bg);

  const defs = svgEl('defs');
  g.appendChild(defs);

  // Cap cells so node count stays well under budget.
  const cols = rng.int(4, 10);
  const rows = Math.max(2, Math.round((cols * bounds.h) / bounds.w));
  const cw = bounds.w / cols;
  const ch = bounds.h / rows;
  const ramp: Color[] = [fg, palette.accent, palette.primary, bg];
  const swirl = rng.range(0.3, 1.2); // how fast angle rotates across the grid

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const id = uid('cell');
      const angle = (c + r) * swirl;
      const dx = Math.cos(angle);
      const dy = Math.sin(angle);
      const grad = svgEl('linearGradient', {
        id,
        x1: (0.5 - dx * 0.5).toFixed(3),
        y1: (0.5 - dy * 0.5).toFixed(3),
        x2: (0.5 + dx * 0.5).toFixed(3),
        y2: (0.5 + dy * 0.5).toFixed(3),
      });
      const idx = (c + r) % ramp.length;
      grad.appendChild(svgEl('stop', {offset: '0', 'stop-color': ramp[idx]}));
      grad.appendChild(svgEl('stop', {offset: '1', 'stop-color': ramp[(idx + 1) % ramp.length]}));
      defs.appendChild(grad);

      g.appendChild(
        svgEl('rect', {
          x: bounds.x + c * cw,
          y: bounds.y + r * ch,
          width: cw + 0.5,
          height: ch + 0.5,
          fill: `url(#${id})`,
        }),
      );
    }
  }
  return g;
}

registerGenerator({name: 'gradient-grid', category: 'gradient', weight: 2, render});
