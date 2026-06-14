/**
 * Drifting smoke wisps: several tapering curls rise from the bottom edge,
 * meandering sideways via stacked sine drift and curling at the top. Each wisp
 * is a filled ribbon that narrows as it rises and fades with height, layered at
 * low opacity so overlapping wisps build up soft, smoky density.
 */
import {registerGenerator} from '../core/registry.js';
import {DesignContext, Rect} from '../core/types.js';
import {baseFill, clipped, palettePair, svgEl} from './_generator.js';

function render(ctx: DesignContext, bounds: Rect): SVGElement {
  const {rng} = ctx;
  const {bg, fg} = palettePair(ctx, rng);
  const g = clipped(ctx, bounds);
  baseFill(g, bounds, bg);

  const wisps = rng.int(4, 7);
  const steps = 60;
  for (let w = 0; w < wisps; w++) {
    const baseX = bounds.x + rng.range(0.1, 0.9) * bounds.w;
    const baseW = bounds.w * rng.range(0.04, 0.1);
    const driftAmp = bounds.w * rng.range(0.08, 0.22);
    const freq1 = rng.range(1.2, 2.6);
    const freq2 = rng.range(3.0, 5.5);
    const phase1 = rng.range(0, Math.PI * 2);
    const phase2 = rng.range(0, Math.PI * 2);
    const rise = rng.range(0.85, 1.05);

    const left: string[] = [];
    const right: string[] = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const y = bounds.y + bounds.h * (1 - t * rise);
      const cx = baseX + driftAmp * (Math.sin(t * Math.PI * freq1 + phase1) * 0.7 +
        Math.sin(t * Math.PI * freq2 + phase2) * 0.3) * t;
      // Width swells low, tapers to a thread at the top.
      const ww = baseW * (1 - t) * (0.5 + 0.5 * Math.sin(t * Math.PI));
      left.push((i === 0 ? 'M' : 'L') + (cx - ww).toFixed(1) + ' ' + y.toFixed(1));
      right.push('L' + (cx + ww).toFixed(1) + ' ' + y.toFixed(1));
    }
    right.reverse();
    const d = left.join('') + right.join('') + 'Z';
    g.appendChild(svgEl('path', {d, fill: fg, 'fill-opacity': rng.range(0.18, 0.4).toFixed(2)}));
  }
  return g;
}

registerGenerator({name: 'smoke-wisps', category: 'organic', weight: 2, render});
