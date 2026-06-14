/**
 * Ink splatter: a few large blots, each surrounded by a halo of flung satellite
 * dots and thin directional drips, mimicking flicked ink on paper. Dots and
 * drips are batched into a single path per cluster color to keep nodes low.
 */
import {registerGenerator} from '../core/registry.js';
import {Color, DesignContext, Rect} from '../core/types.js';
import {baseFill, clipped, palettePair, svgEl} from './_generator.js';

function render(ctx: DesignContext, bounds: Rect): SVGElement {
  const {rng, palette} = ctx;
  const {bg, fg} = palettePair(ctx, rng);
  const g = clipped(ctx, bounds);
  baseFill(g, bounds, bg);

  const inkColors: Color[] = [fg, palette.accent, palette.primary];
  const minDim = Math.min(bounds.w, bounds.h);
  const blots = rng.int(3, 6);

  for (let b = 0; b < blots; b++) {
    const ink = rng.pick(inkColors);
    const ox = bounds.x + rng.range(0.1, 0.9) * bounds.w;
    const oy = bounds.y + rng.range(0.1, 0.9) * bounds.h;
    const coreR = minDim * rng.range(0.04, 0.11);

    // Core blob as a wobbly circle.
    g.appendChild(svgEl('circle', {cx: ox.toFixed(1), cy: oy.toFixed(1), r: coreR.toFixed(1), fill: ink}));

    // Satellite specks flung outward, plus thin drips, in one path.
    const specks = rng.int(20, 60);
    const spread = coreR * rng.range(4, 9);
    let d = '';
    for (let s = 0; s < specks; s++) {
      const ang = rng.next() * Math.PI * 2;
      const dist = coreR + Math.abs(rng.gaussian(0, spread * 0.4));
      const px = ox + Math.cos(ang) * dist;
      const py = oy + Math.sin(ang) * dist;
      const dotR = Math.max(0.8, coreR * rng.range(0.06, 0.35));
      // Approximate circle as a small diamond for compactness.
      d += `M${px.toFixed(1)} ${(py - dotR).toFixed(1)}`;
      d += `l${dotR.toFixed(1)} ${dotR.toFixed(1)}l${(-dotR).toFixed(1)} ${dotR.toFixed(1)}l${(-dotR).toFixed(1)} ${(-dotR).toFixed(1)}z`;
    }
    // A handful of directional drips streaking off the core.
    const drips = rng.int(2, 5);
    for (let k = 0; k < drips; k++) {
      const ang = rng.next() * Math.PI * 2;
      const len = coreR * rng.range(3, 8);
      const ex = ox + Math.cos(ang) * len;
      const ey = oy + Math.sin(ang) * len;
      const wdt = coreR * rng.range(0.12, 0.3);
      const nx = -Math.sin(ang) * wdt;
      const ny = Math.cos(ang) * wdt;
      d += `M${(ox + nx).toFixed(1)} ${(oy + ny).toFixed(1)}`;
      d += `L${(ox - nx).toFixed(1)} ${(oy - ny).toFixed(1)}`;
      d += `L${ex.toFixed(1)} ${ey.toFixed(1)}z`;
    }
    g.appendChild(svgEl('path', {d, fill: ink}));
  }
  return g;
}

registerGenerator({name: 'splatter', category: 'organic', weight: 2, render});
