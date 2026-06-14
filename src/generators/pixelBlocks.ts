/**
 * Pixel blocks: a coarse mosaic of square cells, each randomly filled or empty
 * in palette colors, like low-res bitmap art.
 */
import {registerGenerator} from '../core/registry.js';
import {Color, DesignContext, Rect} from '../core/types.js';
import {baseFill, clipped, palettePair, svgEl} from './_generator.js';

function render(ctx: DesignContext, bounds: Rect): SVGElement {
  const {rng, palette} = ctx;
  const {bg, fg} = palettePair(ctx, rng);
  const g = clipped(ctx, bounds);
  baseFill(g, bounds, bg);

  const cols = rng.int(12, 32);
  const cw = bounds.w / cols;
  const rows = Math.max(1, Math.round(bounds.h / cw));
  const ch = bounds.h / rows;
  const colors: Color[] = [fg, palette.accent, palette.primary];
  const density = rng.range(0.35, 0.65);

  // One path per color keeps the DOM small.
  const dByColor = new Map<Color, string>();
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!rng.chance(density)) continue;
      const x = bounds.x + c * cw;
      const y = bounds.y + r * ch;
      const color = rng.weighted(colors, [3, 1.4, 1]);
      const prev = dByColor.get(color) ?? '';
      dByColor.set(
        color,
        prev + `M${x.toFixed(1)} ${y.toFixed(1)}h${cw.toFixed(1)}v${ch.toFixed(1)}h${(-cw).toFixed(1)}z`,
      );
    }
  }
  for (const [color, d] of dByColor) {
    g.appendChild(svgEl('path', {d, fill: color}));
  }
  return g;
}

registerGenerator({name: 'pixel-blocks', category: 'techno', weight: 2, render});
