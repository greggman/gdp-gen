/**
 * Halftone dot field: a grid of circles whose radius ramps across the region,
 * producing a tonal gradient like printed halftone screens.
 */
import {registerGenerator} from '../core/registry.js';
import {DesignContext, Rect} from '../core/types.js';
import {clamp} from '../layout/geometry.js';
import {baseFill, clipped, palettePair, svgEl} from './_generator.js';

function render(ctx: DesignContext, bounds: Rect): SVGElement {
  const {rng} = ctx;
  const {bg, fg} = palettePair(ctx, rng);
  const g = clipped(ctx, bounds);
  baseFill(g, bounds, bg);

  const cols = rng.int(10, 28);
  const cell = bounds.w / cols;
  const rows = Math.ceil(bounds.h / cell);
  // Ramp direction: horizontal, vertical, or radial.
  const mode = rng.pick(['h', 'v', 'r'] as const);
  const maxR = cell * 0.52;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = bounds.x + (c + 0.5) * cell;
      const y = bounds.y + (r + 0.5) * cell;
      let t: number;
      if (mode === 'h') t = c / (cols - 1);
      else if (mode === 'v') t = r / (rows - 1);
      else {
        const dx = (x - (bounds.x + bounds.w / 2)) / bounds.w;
        const dy = (y - (bounds.y + bounds.h / 2)) / bounds.h;
        t = clamp(1 - Math.hypot(dx, dy) * 2, 0, 1);
      }
      const radius = maxR * t;
      if (radius < 0.4) continue;
      g.appendChild(svgEl('circle', {cx: x, cy: y, r: radius, fill: fg}));
    }
  }
  return g;
}

registerGenerator({name: 'halftone-dots', category: 'halftone', weight: 3, render});
