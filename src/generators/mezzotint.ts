/**
 * Mezzotint: a dense field of tiny irregular dots scattered at random, their
 * local density falling off smoothly across the plate so the page reads as a
 * continuous tone graded from dark to light -- the look of a rocked mezzotint
 * ground. Every dot is packed into one path to keep the node count low.
 */
import {registerGenerator} from '../core/registry.js';
import {DesignContext, Rect} from '../core/types.js';
import {baseFill, clipped, palettePair, svgEl} from './_generator.js';

function render(ctx: DesignContext, bounds: Rect): SVGElement {
  const {rng} = ctx;
  const {bg, fg} = palettePair(ctx, rng);
  const g = clipped(ctx, bounds);
  baseFill(g, bounds, bg);

  // A tone gradient axis: density is high on one side, low on the other.
  const ang = rng.range(0, Math.PI * 2);
  const ax = Math.cos(ang);
  const ay = Math.sin(ang);
  const flip = rng.chance();

  const minDim = Math.min(bounds.w, bounds.h);
  const rMax = minDim * rng.range(0.006, 0.012);
  const attempts = 4500;

  let d = '';
  for (let i = 0; i < attempts; i++) {
    const x = bounds.x + rng.next() * bounds.w;
    const y = bounds.y + rng.next() * bounds.h;
    // Projection of the point onto the tone axis, normalized to [0,1].
    const u =
      ((x - bounds.x) / bounds.w - 0.5) * ax +
      ((y - bounds.y) / bounds.h - 0.5) * ay;
    let keep = u + 0.5;
    if (flip) keep = 1 - keep;
    // Bias toward keeping dots where tone is dark; reject elsewhere.
    if (rng.next() > keep * keep) continue;
    const r = rMax * rng.range(0.5, 1);
    d += `M${x.toFixed(1)} ${y.toFixed(1)}m${(-r).toFixed(1)} 0a${r.toFixed(1)} ${r.toFixed(1)} 0 1 0 ${(r * 2).toFixed(1)} 0a${r.toFixed(1)} ${r.toFixed(1)} 0 1 0 ${(-r * 2).toFixed(1)} 0`;
  }
  g.appendChild(svgEl('path', {d, fill: fg}));
  return g;
}

registerGenerator({name: 'mezzotint', category: 'halftone', weight: 2, render});
