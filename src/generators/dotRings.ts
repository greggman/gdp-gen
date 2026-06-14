/**
 * Dot rings: dots evenly spaced around a series of concentric rings, the
 * count per ring scaling with circumference for a target-like radial field.
 */
import {registerGenerator} from '../core/registry.js';
import {DesignContext, Rect} from '../core/types.js';
import {baseFill, clipped, palettePair, svgEl} from './_generator.js';

function render(ctx: DesignContext, bounds: Rect): SVGElement {
  const {rng} = ctx;
  const {bg, fg} = palettePair(ctx, rng);
  const g = clipped(ctx, bounds);
  baseFill(g, bounds, bg);

  const cx = bounds.x + bounds.w / 2;
  const cy = bounds.y + bounds.h / 2;
  const maxR = Math.hypot(bounds.w, bounds.h) / 2;
  const rings = rng.int(8, 20);
  const ringStep = maxR / rings;
  const radius = ringStep * rng.range(0.16, 0.34);
  const jitterPhase = rng.chance(0.5);

  let d = '';
  for (let ring = 1; ring <= rings; ring++) {
    const rr = ring * ringStep;
    const circ = 2 * Math.PI * rr;
    const n = Math.max(1, Math.round(circ / (ringStep * rng.range(0.7, 1.0))));
    const phase = jitterPhase ? rng.range(0, Math.PI * 2) : 0;
    for (let i = 0; i < n; i++) {
      const a = phase + (i / n) * Math.PI * 2;
      const x = cx + Math.cos(a) * rr;
      const y = cy + Math.sin(a) * rr;
      d += `M${x.toFixed(1)} ${y.toFixed(1)}m${-radius} 0a${radius} ${radius} 0 1 0 ${radius * 2} 0a${radius} ${radius} 0 1 0 ${-radius * 2} 0`;
    }
  }
  g.appendChild(svgEl('path', {d, fill: fg}));
  return g;
}

registerGenerator({name: 'dot-rings', category: 'dots', weight: 2, render});
