/**
 * 70s rainbow arcs: thick concentric quarter/half rainbow bands sweeping from
 * a corner or edge, in the warm earth-tone striped style of 1970s logos and
 * record sleeves. Bands cycle through the palette swatches.
 */
import {registerGenerator} from '../core/registry.js';
import {DesignContext, Rect} from '../core/types.js';
import {baseFill, clipped, palettePair, svgEl} from './_generator.js';

/** Builds an annular sector path from radius rIn..rOut over angles a0..a1. */
function band(cx: number, cy: number, rIn: number, rOut: number, a0: number, a1: number): string {
  const p = (r: number, a: number): string =>
    `${(cx + r * Math.cos(a)).toFixed(1)} ${(cy + r * Math.sin(a)).toFixed(1)}`;
  const large = a1 - a0 > Math.PI ? 1 : 0;
  return (
    `M${p(rOut, a0)}` +
    `A${rOut.toFixed(1)} ${rOut.toFixed(1)} 0 ${large} 1 ${p(rOut, a1)}` +
    `L${p(rIn, a1)}` +
    `A${rIn.toFixed(1)} ${rIn.toFixed(1)} 0 ${large} 0 ${p(rIn, a0)}Z`
  );
}

function render(ctx: DesignContext, bounds: Rect): SVGElement {
  const {rng, palette} = ctx;
  const {bg} = palettePair(ctx, rng);
  const g = clipped(ctx, bounds);
  baseFill(g, bounds, bg);

  // Color cycle from the harmony swatches, excluding the background.
  const cycle = palette.colors.filter(c => c !== bg);
  const ramp = cycle.length >= 2
    ? cycle
    : [palette.primary, palette.accent, palette.text];

  // Pick a corner or edge as the arc origin.
  const corners = [
    {cx: bounds.x, cy: bounds.y, a0: 0, a1: Math.PI / 2},
    {cx: bounds.x + bounds.w, cy: bounds.y, a0: Math.PI / 2, a1: Math.PI},
    {cx: bounds.x + bounds.w, cy: bounds.y + bounds.h, a0: Math.PI, a1: Math.PI * 1.5},
    {cx: bounds.x, cy: bounds.y + bounds.h, a0: Math.PI * 1.5, a1: Math.PI * 2},
    // Bottom-center half arc.
    {cx: bounds.x + bounds.w / 2, cy: bounds.y + bounds.h, a0: Math.PI, a1: Math.PI * 2},
  ];
  const o = rng.pick(corners);
  const maxR = Math.hypot(bounds.w, bounds.h) * (o.a1 - o.a0 > Math.PI / 2 + 0.1 ? 0.85 : 1.05);

  const count = rng.int(5, 9);
  const ringW = maxR / count;
  for (let i = 0; i < count; i++) {
    const rOut = maxR - i * ringW;
    const rIn = Math.max(0, rOut - ringW * rng.range(0.78, 0.95));
    g.appendChild(
      svgEl('path', {d: band(o.cx, o.cy, rIn, rOut, o.a0, o.a1), fill: ramp[i % ramp.length]}),
    );
  }
  return g;
}

registerGenerator({name: 'seventies-rainbow', category: 'retro', weight: 2, render});
