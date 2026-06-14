/**
 * Organic growth rings: several seed cells scattered across the region each grow
 * a stack of concentric, irregularly lobed rings (like lichen colonies or coral
 * roundels). Rings get more wobbly outward and overlap their neighbors, packing
 * the region with organic roundels.
 */
import {registerGenerator} from '../core/registry.js';
import {DesignContext, Rect} from '../core/types.js';
import {baseFill, clipped, palettePair, svgEl} from './_generator.js';

function render(ctx: DesignContext, bounds: Rect): SVGElement {
  const {rng, palette} = ctx;
  const {bg, fg} = palettePair(ctx, rng);
  const accent = palette.accent === fg ? palette.primary : palette.accent;
  const g = clipped(ctx, bounds);
  baseFill(g, bounds, bg);

  const minDim = Math.min(bounds.w, bounds.h);
  const colonies = rng.int(4, 8);
  const segs = 48;
  let dMain = '';
  let dAccent = '';

  for (let cIdx = 0; cIdx < colonies; cIdx++) {
    const cx = bounds.x + rng.range(0.05, 0.95) * bounds.w;
    const cy = bounds.y + rng.range(0.05, 0.95) * bounds.h;
    const maxR = minDim * rng.range(0.18, 0.42);
    const lobes = rng.int(4, 9);
    const phase = rng.range(0, Math.PI * 2);
    const rings = rng.int(4, 8);
    const step = maxR / rings;
    for (let ri = 1; ri <= rings; ri++) {
      const baseR = ri * step;
      const wobble = 0.04 + 0.1 * (ri / rings);
      let ring = '';
      for (let i = 0; i <= segs; i++) {
        const a = (i / segs) * Math.PI * 2;
        const rr = baseR * (1 + wobble * Math.sin(a * lobes + phase));
        const x = cx + Math.cos(a) * rr;
        const y = cy + Math.sin(a) * rr;
        ring += (i === 0 ? 'M' : 'L') + x.toFixed(1) + ' ' + y.toFixed(1);
      }
      ring += 'Z';
      if (ri % 2 === 0) dAccent += ring;
      else dMain += ring;
    }
  }
  g.appendChild(svgEl('path', {d: dMain, fill: 'none', stroke: fg, 'stroke-width': 1.8}));
  g.appendChild(svgEl('path', {d: dAccent, fill: 'none', stroke: accent, 'stroke-width': 1.4, 'stroke-opacity': 0.85}));
  return g;
}

registerGenerator({name: 'growth-rings', category: 'organic', weight: 2, render});
