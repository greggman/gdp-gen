/**
 * Barcode: vertical bars of randomly varying width, packed edge to edge across
 * the region like a product barcode. Quiet margins at top and bottom keep the
 * bars reading as a code rather than a solid block.
 */
import {registerGenerator} from '../core/registry.js';
import {DesignContext, Rect} from '../core/types.js';
import {baseFill, clipped, palettePair, svgEl} from './_generator.js';

function render(ctx: DesignContext, bounds: Rect): SVGElement {
  const {rng} = ctx;
  const {bg, fg} = palettePair(ctx, rng);
  const g = clipped(ctx, bounds);
  baseFill(g, bounds, bg);

  const margin = bounds.h * rng.range(0.04, 0.12);
  const barTop = bounds.y + margin;
  const barH = bounds.h - margin * 2;

  // Pick a base module width; bars are 1..4 modules wide, gaps likewise.
  const modules = rng.int(40, 90);
  const unit = bounds.w / modules;

  let d = '';
  let x = bounds.x;
  let drawBar = true;
  while (x < bounds.x + bounds.w) {
    const widthUnits = rng.int(1, 4);
    const w = widthUnits * unit;
    if (drawBar) {
      const fx = x.toFixed(2);
      const fw = Math.min(w, bounds.x + bounds.w - x).toFixed(2);
      d += `M${fx} ${barTop.toFixed(2)}h${fw}v${barH.toFixed(2)}h-${fw}z`;
    }
    x += w;
    drawBar = !drawBar;
  }
  g.appendChild(svgEl('path', {d, fill: fg}));
  return g;
}

registerGenerator({name: 'barcode', category: 'digital', weight: 2, render});
