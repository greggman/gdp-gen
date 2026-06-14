/**
 * Fish scales (scallops): overlapping semicircular scales arranged in offset
 * rows, each row overlapping the one above so only the rounded lower edge shows.
 * Rows alternate palette colors with an occasional accent scale, like a koi or
 * art-deco fan motif.
 */
import {registerGenerator} from '../core/registry.js';
import {Color, DesignContext, Rect} from '../core/types.js';
import {baseFill, clipped, palettePair, svgEl} from './_generator.js';

function render(ctx: DesignContext, bounds: Rect): SVGElement {
  const {rng, palette} = ctx;
  const {bg, fg} = palettePair(ctx, rng);
  const g = clipped(ctx, bounds);
  baseFill(g, bounds, bg);

  const tones: Color[] = [fg, palette.primary];
  const accent = palette.accent;
  const cols = rng.int(4, 10);
  const r = bounds.w / cols / 2;
  // Rows overlap: vertical step is less than radius so scales stack.
  const vStep = r * rng.range(0.55, 0.8);
  const rows = Math.ceil(bounds.h / vStep) + 2;

  const accentChance = rng.range(0.04, 0.15);
  // Draw top rows first so lower rows overlap them.
  for (let row = -1; row < rows; row++) {
    const cy = bounds.y + row * vStep;
    const offset = (row & 1) === 1 ? r : 0;
    const base = bounds.x - r + offset;
    const cells = cols + 2;
    for (let c = 0; c < cells; c++) {
      const cx = base + c * 2 * r;
      let fill: Color = (row + c) % 2 === 0 ? tones[0] : tones[1];
      if (rng.chance(accentChance)) fill = accent;
      // A downward semicircle (scallop).
      const d = `M ${(cx - r).toFixed(2)} ${cy.toFixed(2)} ` +
        `A ${r.toFixed(2)} ${r.toFixed(2)} 0 0 0 ${(cx + r).toFixed(2)} ${cy.toFixed(2)} Z`;
      g.appendChild(svgEl('path', {d, fill, stroke: bg, 'stroke-width': (r * 0.04).toFixed(2)}));
    }
  }
  return g;
}

registerGenerator({name: 'fish-scales', category: 'tiling', weight: 2, render});
