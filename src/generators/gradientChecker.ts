/**
 * Gradient checker: a checkerboard where the two "colors" are two opposing
 * linear gradients (bg->fg and fg->bg) rather than flat fills, so each cell is a
 * little fade and the alternation creates a quilted, shifting grid.
 */
import {registerGenerator} from '../core/registry.js';
import {Color, DesignContext, Rect} from '../core/types.js';
import {uid} from '../core/renderer.js';
import {baseFill, clipped, palettePair, svgEl} from './_generator.js';

function makeGrad(id: string, from: Color, to: Color, angle: number): SVGElement {
  const rad = (angle * Math.PI) / 180;
  const x2 = (Math.cos(rad) * 0.5 + 0.5).toFixed(3);
  const y2 = (Math.sin(rad) * 0.5 + 0.5).toFixed(3);
  const x1 = (1 - Number(x2)).toFixed(3);
  const y1 = (1 - Number(y2)).toFixed(3);
  const grad = svgEl('linearGradient', {id, x1, y1, x2, y2});
  grad.appendChild(svgEl('stop', {offset: '0', 'stop-color': from}));
  grad.appendChild(svgEl('stop', {offset: '1', 'stop-color': to}));
  return grad;
}

function render(ctx: DesignContext, bounds: Rect): SVGElement {
  const {rng} = ctx;
  const {bg, fg} = palettePair(ctx, rng);
  const g = clipped(ctx, bounds);
  baseFill(g, bounds, bg);

  const angle = rng.range(0, 360);
  const idA = uid('gc-a');
  const idB = uid('gc-b');
  const defs = svgEl('defs');
  defs.appendChild(makeGrad(idA, bg, fg, angle));
  defs.appendChild(makeGrad(idB, fg, bg, angle));
  g.appendChild(defs);

  const cols = rng.int(5, 12);
  const rows = Math.max(3, Math.round(cols * (bounds.h / bounds.w)));
  const cw = bounds.w / cols;
  const ch = bounds.h / rows;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const fill = (r + c) % 2 === 0 ? `url(#${idA})` : `url(#${idB})`;
      g.appendChild(
        svgEl('rect', {
          x: (bounds.x + c * cw).toFixed(1),
          y: (bounds.y + r * ch).toFixed(1),
          width: (cw + 0.5).toFixed(1),
          height: (ch + 0.5).toFixed(1),
          fill,
        }),
      );
    }
  }
  return g;
}

registerGenerator({name: 'gradient-checker', category: 'gradient', weight: 2, render});
