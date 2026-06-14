/**
 * Ribbon bands: thick horizontal ribbons that undulate across the region in
 * parallel, each a filled wavy band of constant thickness. Smooth, glossy
 * postmodern stripes.
 */
import {registerGenerator} from '../core/registry.js';
import {Color, DesignContext, Rect} from '../core/types.js';
import {baseFill, clipped, palettePair, svgEl} from './_generator.js';

function render(ctx: DesignContext, bounds: Rect): SVGElement {
  const {rng, palette} = ctx;
  const {bg} = palettePair(ctx, rng);
  const g = clipped(ctx, bounds);
  baseFill(g, bounds, bg);

  const inks: Color[] = rng.shuffle([
    palette.primary,
    palette.accent,
    palette.colors[1] ?? palette.primary,
    palette.colors[3] ?? palette.accent,
  ]);
  const bands = rng.int(4, 9);
  // Overlap a little so ribbons cover the whole height including the waves.
  const slot = bounds.h / bands;
  const thickness = slot * rng.range(1.05, 1.5);
  const amp = slot * rng.range(0.25, 0.6);
  const segs = Math.max(3, Math.min(24, Math.round(bounds.w / (slot * 1.2))));
  const stepX = bounds.w / segs;
  const freq = rng.range(0.6, 1.4);

  for (let i = bands - 1; i >= 0; i--) {
    const yc = bounds.y + slot * (i + 0.5);
    const phase = rng.next() * Math.PI * 2;
    const half = thickness / 2;
    const yAt = (xi: number) => yc + amp * Math.sin(phase + xi * freq);

    let top = `M ${(bounds.x - stepX).toFixed(1)} ${(yAt(0) - half).toFixed(1)}`;
    for (let s = 0; s <= segs; s++) {
      const x0 = bounds.x + (s - 1) * stepX;
      const cx = x0 + stepX / 2;
      const ex = x0 + stepX;
      top += ` Q ${cx.toFixed(1)} ${(yAt(s) - half).toFixed(1)} ${ex.toFixed(1)} ${(yAt(s + 1) - half).toFixed(1)}`;
    }
    let bottom = ` L ${(bounds.x + bounds.w + stepX).toFixed(1)} ${(yAt(segs + 1) + half).toFixed(1)}`;
    for (let s = segs; s >= 0; s--) {
      const x0 = bounds.x + (s - 1) * stepX;
      const cx = x0 + stepX / 2;
      const sx = x0;
      bottom += ` Q ${cx.toFixed(1)} ${(yAt(s) + half).toFixed(1)} ${sx.toFixed(1)} ${(yAt(s - 1) + half).toFixed(1)}`;
    }
    g.appendChild(svgEl('path', {d: top + bottom + ' Z', fill: inks[i % inks.length]}));
  }
  return g;
}

registerGenerator({name: 'ribbon-bands', category: 'memphis', weight: 2, render});
