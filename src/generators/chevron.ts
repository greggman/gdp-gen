/**
 * Chevron: bold rows of V-shaped arrows pointing the same direction, each row a
 * thick stroked path so the chevrons read as nested arrowheads. Rows alternate
 * palette colors for a high-contrast op-art band, a poster and textile classic.
 */
import {registerGenerator} from '../core/registry.js';
import {Color, DesignContext, Rect} from '../core/types.js';
import {baseFill, clipped, palettePair, svgEl} from './_generator.js';

function render(ctx: DesignContext, bounds: Rect): SVGElement {
  const {rng, palette} = ctx;
  const {bg, fg} = palettePair(ctx, rng);
  const g = clipped(ctx, bounds);
  baseFill(g, bounds, bg);

  const tones: Color[] = [fg, palette.primary, palette.accent];
  const cols = rng.int(3, 8);
  const w = bounds.w / cols; // width of one chevron V
  const amp = w * rng.range(0.5, 0.9); // peak height of the V
  const strokeW = (bounds.h / rng.int(8, 18));
  const vStep = strokeW * rng.range(1.0, 1.4);
  const rows = Math.ceil((bounds.h + amp) / vStep) + 2;
  const pointUp = rng.chance(0.5);

  let placed = 0;
  for (let row = -2; row < rows && placed < 1400; row++) {
    const fill = tones[((row % tones.length) + tones.length) % tones.length];
    const yBase = bounds.y + row * vStep;
    let d = '';
    for (let c = -1; c <= cols; c++) {
      const x0 = bounds.x + c * w;
      const xMid = x0 + w / 2;
      const x1 = x0 + w;
      const yPeak = pointUp ? yBase - amp : yBase + amp;
      d += `M ${x0.toFixed(2)} ${yBase.toFixed(2)} ` +
        `L ${xMid.toFixed(2)} ${yPeak.toFixed(2)} ` +
        `L ${x1.toFixed(2)} ${yBase.toFixed(2)} `;
      placed++;
    }
    g.appendChild(
      svgEl('path', {
        d, fill: 'none', stroke: fill,
        'stroke-width': strokeW.toFixed(2),
        'stroke-linejoin': 'miter', 'stroke-linecap': 'butt',
      }),
    );
  }
  return g;
}

registerGenerator({name: 'chevron', category: 'tiling', weight: 2, render});
