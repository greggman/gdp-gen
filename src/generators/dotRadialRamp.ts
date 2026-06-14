/**
 * Dot radial ramp: a regular dot grid whose dot size grows (or shrinks) with
 * distance from a focal point, a classic halftone vignette / spotlight effect.
 */
import {registerGenerator} from '../core/registry.js';
import {DesignContext, Rect} from '../core/types.js';
import {baseFill, clipped, palettePair, svgEl} from './_generator.js';

function render(ctx: DesignContext, bounds: Rect): SVGElement {
  const {rng} = ctx;
  const {bg, fg} = palettePair(ctx, rng);
  const g = clipped(ctx, bounds);
  baseFill(g, bounds, bg);

  const cols = rng.int(12, 26);
  const step = bounds.w / cols;
  const rows = Math.max(1, Math.round(bounds.h / step));
  const fx = bounds.x + bounds.w * rng.range(0.2, 0.8);
  const fy = bounds.y + bounds.h * rng.range(0.2, 0.8);
  const maxDist = Math.hypot(bounds.w, bounds.h);
  const maxR = step * 0.48;
  const grow = rng.chance(0.5);
  const power = rng.range(1, 2.2);

  let d = '';
  for (let r = 0; r <= rows; r++) {
    for (let c = 0; c <= cols; c++) {
      const cx = bounds.x + c * step;
      const cy = bounds.y + r * step;
      let t = Math.hypot(cx - fx, cy - fy) / maxDist;
      t = Math.min(1, t);
      t = Math.pow(t, power);
      const radius = (grow ? t : 1 - t) * maxR;
      if (radius < 0.4) continue;
      d += `M${cx.toFixed(1)} ${cy.toFixed(1)}m${-radius} 0a${radius} ${radius} 0 1 0 ${radius * 2} 0a${radius} ${radius} 0 1 0 ${-radius * 2} 0`;
    }
  }
  g.appendChild(svgEl('path', {d, fill: fg}));
  return g;
}

registerGenerator({name: 'dot-radial-ramp', category: 'dots', weight: 2, render});
