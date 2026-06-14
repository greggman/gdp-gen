/**
 * Concentric polygons: nested regular polygons sharing a center, each smaller
 * than the last and rotated by a constant increment so edges spiral inward.
 */
import {registerGenerator} from '../core/registry.js';
import {Color, DesignContext, Rect} from '../core/types.js';
import {baseFill, clipped, palettePair, svgEl} from './_generator.js';

function render(ctx: DesignContext, bounds: Rect): SVGElement {
  const {rng, palette} = ctx;
  const {bg, fg} = palettePair(ctx, rng);
  const g = clipped(ctx, bounds);
  baseFill(g, bounds, bg);

  const cx = bounds.x + bounds.w / 2;
  const cy = bounds.y + bounds.h / 2;
  const maxR = Math.hypot(bounds.w, bounds.h) / 2;
  const sides = rng.int(3, 8);
  const count = rng.int(6, 18);
  const rotStep = rng.range(0.05, 0.4);
  const filled = rng.chance(0.4);
  const colors: Color[] = [fg, palette.accent, palette.primary];
  const start = rng.range(0, Math.PI * 2);

  for (let i = 0; i < count; i++) {
    const t = 1 - i / count;
    const r = maxR * t;
    if (r < 1) continue;
    const rot = start + i * rotStep;
    let pts = '';
    for (let s = 0; s < sides; s++) {
      const a = rot + (s / sides) * Math.PI * 2;
      pts += `${(cx + Math.cos(a) * r).toFixed(2)},${(cy + Math.sin(a) * r).toFixed(2)} `;
    }
    const color = colors[i % colors.length];
    g.appendChild(
      filled
        ? svgEl('polygon', {points: pts.trim(), fill: color})
        : svgEl('polygon', {
            points: pts.trim(),
            fill: 'none',
            stroke: color,
            'stroke-width': (maxR * 0.012 + 0.5).toFixed(2),
          }),
    );
  }
  return g;
}

registerGenerator({
  name: 'concentric-polygons',
  category: 'radial',
  weight: 2,
  render,
});
