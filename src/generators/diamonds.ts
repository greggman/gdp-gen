/**
 * Rhombus tiling: a field of diamonds (rotated squares) packed edge to edge in
 * offset rows. Two palette colors alternate per cell with sparse accent diamonds,
 * evoking argyle and harlequin patterns.
 */
import {registerGenerator} from '../core/registry.js';
import {Color, DesignContext, Rect} from '../core/types.js';
import {baseFill, clipped, palettePair, svgEl} from './_generator.js';

function render(ctx: DesignContext, bounds: Rect): SVGElement {
  const {rng, palette} = ctx;
  const {bg, fg} = palettePair(ctx, rng);
  const g = clipped(ctx, bounds);
  baseFill(g, bounds, bg);

  const accent = palette.accent;
  const cols = rng.int(3, 8);
  const dw = bounds.w / cols; // full diamond width
  const ratio = rng.range(1.1, 1.8); // height-to-width for tall or squat diamonds
  const dh = dw * ratio;
  const hw = dw / 2;
  const hh = dh / 2;
  const rows = Math.ceil(bounds.h / hh) + 2;

  const accentChance = rng.range(0.06, 0.2);
  for (let row = -1; row < rows; row++) {
    const offset = (row & 1) === 1 ? hw : 0;
    const cy = bounds.y + (row * hh);
    for (let c = -1; c <= cols; c++) {
      const cx = bounds.x + c * dw + offset;
      let fill: Color = (row + c) % 2 === 0 ? fg : bg;
      if (rng.chance(accentChance)) fill = accent;
      const pts = `${cx},${(cy - hh).toFixed(2)} ` +
        `${(cx + hw).toFixed(2)},${cy} ` +
        `${cx},${(cy + hh).toFixed(2)} ` +
        `${(cx - hw).toFixed(2)},${cy}`;
      g.appendChild(svgEl('polygon', {points: pts, fill}));
    }
  }
  return g;
}

registerGenerator({name: 'diamonds', category: 'tiling', weight: 2, render});
