/**
 * Gradient halftone: a regular grid of dots whose radius ramps smoothly along a
 * chosen axis, from pinpoint specks at one edge to fat overlapping circles at
 * the other. The classic AM-halftone gradient used to fade an image to white.
 * All dots are merged into a single path.
 */
import {registerGenerator} from '../core/registry.js';
import {DesignContext, Rect} from '../core/types.js';
import {baseFill, clipped, palettePair, svgEl} from './_generator.js';

function render(ctx: DesignContext, bounds: Rect): SVGElement {
  const {rng} = ctx;
  const {bg, fg} = palettePair(ctx, rng);
  const g = clipped(ctx, bounds);
  baseFill(g, bounds, bg);

  const minDim = Math.min(bounds.w, bounds.h);
  const cell = minDim * rng.range(0.04, 0.07);
  const cols = Math.max(2, Math.ceil(bounds.w / cell));
  const rows = Math.max(2, Math.ceil(bounds.h / cell));
  const cw = bounds.w / cols;
  const ch = bounds.h / rows;
  const rMax = Math.max(cw, ch) * 0.72;

  // Gradient direction in normalized space.
  const ang = rng.pick([0, Math.PI / 2, Math.PI / 4, (3 * Math.PI) / 4, rng.range(0, Math.PI * 2)]);
  const ax = Math.cos(ang);
  const ay = Math.sin(ang);
  const flip = rng.chance();

  let d = '';
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = bounds.x + (c + 0.5) * cw;
      const y = bounds.y + (r + 0.5) * ch;
      const nx = (c + 0.5) / cols - 0.5;
      const ny = (r + 0.5) / rows - 0.5;
      let t = nx * ax + ny * ay + 0.5;
      if (flip) t = 1 - t;
      t = Math.max(0, Math.min(1, t));
      const rad = rMax * t * t;
      if (rad < 0.4) continue;
      d += `M${x.toFixed(1)} ${y.toFixed(1)}m${(-rad).toFixed(1)} 0a${rad.toFixed(1)} ${rad.toFixed(1)} 0 1 0 ${(rad * 2).toFixed(1)} 0a${rad.toFixed(1)} ${rad.toFixed(1)} 0 1 0 ${(-rad * 2).toFixed(1)} 0`;
    }
  }
  g.appendChild(svgEl('path', {d, fill: fg}));
  return g;
}

registerGenerator({name: 'gradient-halftone', category: 'halftone', weight: 2, render});
