/**
 * Starfield: scattered points of varying brightness and size, most tiny with a
 * few bright "stars" rendered as four-point sparkles. Optional faint nebula
 * tint bands suggest depth. Points are batched into single paths per size class.
 */
import {registerGenerator} from '../core/registry.js';
import {Color, DesignContext, Rect} from '../core/types.js';
import {baseFill, clipped, palettePair, svgEl} from './_generator.js';

function render(ctx: DesignContext, bounds: Rect): SVGElement {
  const {rng, palette} = ctx;
  // Stars read best on the darker of the pair.
  const pair = palettePair(ctx, rng);
  const dark = palette.backgroundIsDark ? palette.background : pair.bg;
  const g = clipped(ctx, bounds);
  baseFill(g, bounds, dark);

  const starColors: Color[] = [
    palette.primary,
    palette.accent,
    palette.colors[2] ?? palette.primary,
  ];
  const minDim = Math.min(bounds.w, bounds.h);
  const area = bounds.w * bounds.h;

  // Dim dust as tiny dots in one path.
  const dust = Math.min(1000, Math.round(area / 600));
  let dustD = '';
  for (let i = 0; i < dust; i++) {
    const x = (bounds.x + rng.next() * bounds.w).toFixed(1);
    const y = (bounds.y + rng.next() * bounds.h).toFixed(1);
    const r = (minDim * 0.0015).toFixed(2);
    dustD += `M${x} ${y}m${-r} 0a${r} ${r} 0 1 0 ${Number(r) * 2} 0a${r} ${r} 0 1 0 ${-Number(r) * 2} 0`;
  }
  g.appendChild(svgEl('path', {d: dustD, fill: rng.pick(starColors), 'fill-opacity': '0.5'}));

  // Mid stars: small circles in one path.
  const mid = Math.min(300, Math.round(area / 4000));
  let midD = '';
  for (let i = 0; i < mid; i++) {
    const x = bounds.x + rng.next() * bounds.w;
    const y = bounds.y + rng.next() * bounds.h;
    const r = minDim * rng.range(0.002, 0.006);
    midD += `M${(x - r).toFixed(1)} ${y.toFixed(1)}a${r.toFixed(1)} ${r.toFixed(1)} 0 1 0 ${(r * 2).toFixed(1)} 0a${r.toFixed(1)} ${r.toFixed(1)} 0 1 0 ${(-r * 2).toFixed(1)} 0`;
  }
  g.appendChild(svgEl('path', {d: midD, fill: rng.pick(starColors)}));

  // Bright stars: four-point sparkles, individually colored.
  const bright = rng.int(4, 14);
  for (let i = 0; i < bright; i++) {
    const cx = bounds.x + rng.next() * bounds.w;
    const cy = bounds.y + rng.next() * bounds.h;
    const r = minDim * rng.range(0.01, 0.03);
    const r2 = r * 0.28;
    const d =
      `M${cx.toFixed(1)} ${(cy - r).toFixed(1)}` +
      `L${(cx + r2).toFixed(1)} ${(cy - r2).toFixed(1)}` +
      `L${(cx + r).toFixed(1)} ${cy.toFixed(1)}` +
      `L${(cx + r2).toFixed(1)} ${(cy + r2).toFixed(1)}` +
      `L${cx.toFixed(1)} ${(cy + r).toFixed(1)}` +
      `L${(cx - r2).toFixed(1)} ${(cy + r2).toFixed(1)}` +
      `L${(cx - r).toFixed(1)} ${cy.toFixed(1)}` +
      `L${(cx - r2).toFixed(1)} ${(cy - r2).toFixed(1)}z`;
    g.appendChild(svgEl('path', {d, fill: rng.pick(starColors)}));
  }
  return g;
}

registerGenerator({name: 'starfield', category: 'scatter', weight: 2, render});
