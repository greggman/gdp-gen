/**
 * Wood grain rings: a set of nested, slightly wobbling closed loops around an
 * off-center pith, like the end-grain of a log. Concentric growth rings are
 * distorted by low-frequency noise so they read as natural wood, and a few
 * straight grain lines run off to the edges.
 */
import {registerGenerator} from '../core/registry.js';
import {DesignContext, Rect} from '../core/types.js';
import {baseFill, clipped, palettePair, svgEl} from './_generator.js';

function render(ctx: DesignContext, bounds: Rect): SVGElement {
  const {rng} = ctx;
  const {bg, fg} = palettePair(ctx, rng);
  const g = clipped(ctx, bounds);
  baseFill(g, bounds, bg);

  // Pith near a corner so rings sweep across the whole panel.
  const cx = bounds.x + rng.range(-0.2, 0.3) * bounds.w;
  const cy = bounds.y + rng.range(0.2, 0.8) * bounds.h;
  const maxR = Math.hypot(bounds.w, bounds.h) * 1.15;

  // Low-frequency angular distortion shared by all rings (wood is coherent).
  const lobes = rng.int(3, 6);
  const phase = rng.range(0, Math.PI * 2);
  const lobeAmt = rng.range(0.06, 0.16);
  const stretch = rng.range(1.2, 2.0);
  const tilt = rng.range(0, Math.PI);
  const cosT = Math.cos(tilt);
  const sinT = Math.sin(tilt);

  const segs = 80;
  const ringStep = maxR / rng.int(22, 34);
  let d = '';
  for (let r = ringStep; r < maxR; r += ringStep * rng.range(0.7, 1.3)) {
    let ring = '';
    for (let i = 0; i <= segs; i++) {
      const a = (i / segs) * Math.PI * 2;
      const wob = 1 + lobeAmt * Math.sin(a * lobes + phase + r * 0.01);
      const rr = r * wob;
      // Elliptical (stretched) ring, then rotate by tilt.
      const ex = Math.cos(a) * rr * stretch;
      const ey = Math.sin(a) * rr;
      const x = cx + ex * cosT - ey * sinT;
      const y = cy + ex * sinT + ey * cosT;
      ring += (i === 0 ? 'M' : 'L') + x.toFixed(1) + ' ' + y.toFixed(1);
    }
    d += ring + 'Z';
  }
  g.appendChild(svgEl('path', {d, fill: 'none', stroke: fg, 'stroke-width': rng.range(1.4, 2.6)}));
  return g;
}

registerGenerator({name: 'wood-grain', category: 'organic', weight: 2, render});
