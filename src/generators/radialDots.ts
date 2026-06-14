/**
 * Radial dots: dots placed along evenly spaced spokes radiating from the
 * center, with dot size growing or shrinking outward. All dots are merged into
 * one path to keep the DOM light.
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
  const spokes = rng.int(8, 28);
  const rings = rng.int(5, 16);
  const grow = rng.chance(0.6);
  const baseDot = (maxR / rings) * rng.range(0.12, 0.3);
  const phase = rng.range(0, Math.PI * 2);

  let d = '';
  for (let s = 0; s < spokes; s++) {
    const a = phase + (s / spokes) * Math.PI * 2;
    const ca = Math.cos(a);
    const sa = Math.sin(a);
    for (let i = 1; i <= rings; i++) {
      const t = i / rings;
      const r = t * maxR;
      const dot = grow ? baseDot * (0.4 + t) : baseDot * (1.4 - t);
      const x = (cx + ca * r).toFixed(2);
      const y = (cy + sa * r).toFixed(2);
      d += `M${x} ${y}m${-dot.toFixed(2)} 0a${dot.toFixed(2)} ${dot.toFixed(
        2,
      )} 0 1 0 ${(dot * 2).toFixed(2)} 0a${dot.toFixed(2)} ${dot.toFixed(2)} 0 1 0 ${(
        -dot * 2
      ).toFixed(2)} 0z`;
    }
  }
  g.appendChild(svgEl('path', {d, fill: fg}));
  return g;
}

registerGenerator({name: 'radial-dots', category: 'radial', weight: 2, render});
