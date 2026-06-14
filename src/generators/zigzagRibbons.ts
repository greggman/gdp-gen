/**
 * Zigzag ribbons: parallel strips that zigzag across the region in sharp
 * chevron steps, alternating colors. A crisp, angular cousin of the wavy
 * ribbon, evoking 80s sportswear graphics.
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
  const bands = rng.int(4, 10);
  const slot = bounds.h / bands;
  const thickness = slot * rng.range(1.05, 1.6);
  const amp = slot * rng.range(0.5, 1.1);
  const teeth = Math.max(2, Math.min(16, rng.int(3, 10)));
  const stepX = bounds.w / teeth;

  for (let i = bands - 1; i >= 0; i--) {
    const yc = bounds.y + slot * (i + 0.5);
    const up = rng.chance();
    const half = thickness / 2;
    const yAt = (k: number) => yc + (((k % 2 === 0) === up ? -1 : 1) * amp) / 2;

    let top = `M ${(bounds.x - stepX).toFixed(1)} ${(yAt(0) - half).toFixed(1)}`;
    for (let k = 0; k <= teeth + 1; k++) {
      const x = bounds.x + (k - 1) * stepX;
      top += ` L ${x.toFixed(1)} ${(yAt(k) - half).toFixed(1)}`;
    }
    let bottom = '';
    for (let k = teeth + 1; k >= 0; k--) {
      const x = bounds.x + (k - 1) * stepX;
      bottom += ` L ${x.toFixed(1)} ${(yAt(k) + half).toFixed(1)}`;
    }
    g.appendChild(svgEl('path', {d: top + bottom + ' Z', fill: inks[i % inks.length]}));
  }
  return g;
}

registerGenerator({name: 'zigzag-ribbons', category: 'memphis', weight: 2, render});
