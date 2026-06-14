/**
 * Ornament grid: a repeating decorative quatrefoil/diamond motif tiled across
 * the region in a regular lattice, like embossed wallpaper or tin-ceiling
 * ornament. Each cell holds a four-petal flourish with a center boss; all
 * petals share one combined path per color.
 */
import {registerGenerator} from '../core/registry.js';
import {DesignContext, Rect} from '../core/types.js';
import {baseFill, clipped, palettePair, svgEl} from './_generator.js';

function render(ctx: DesignContext, bounds: Rect): SVGElement {
  const {rng, palette} = ctx;
  const {bg, fg} = palettePair(ctx, rng);
  const accent = palette.accent === fg ? palette.primary : palette.accent;
  const g = clipped(ctx, bounds);
  baseFill(g, bounds, bg);

  const cols = rng.int(3, 7);
  const cell = bounds.w / cols;
  const rows = Math.ceil(bounds.h / cell) + 1;
  const r = cell * rng.range(0.28, 0.36); // petal lobe radius.

  let petals = '';
  let bosses = '';
  for (let row = -1; row < rows; row++) {
    for (let col = -1; col <= cols; col++) {
      const cx = bounds.x + (col + 0.5) * cell;
      const cy = bounds.y + (row + 0.5) * cell;
      // Quatrefoil: four lobes (circles via arcs) at N/E/S/W.
      const off = r * 0.95;
      const dirs = [
        [0, -off], [off, 0], [0, off], [-off, 0],
      ];
      for (const [dx, dy] of dirs) {
        const px = cx + dx;
        const py = cy + dy;
        petals +=
          `M${(px - r).toFixed(1)} ${py.toFixed(1)}` +
          `a${r.toFixed(1)} ${r.toFixed(1)} 0 1 0 ${(r * 2).toFixed(1)} 0` +
          `a${r.toFixed(1)} ${r.toFixed(1)} 0 1 0 ${(-r * 2).toFixed(1)} 0Z`;
      }
      // Diagonal connecting diamond between cells.
      const dR = cell * 0.18;
      petals +=
        `M${cx.toFixed(1)} ${(cy - dR).toFixed(1)}` +
        `L${(cx + dR).toFixed(1)} ${cy.toFixed(1)}` +
        `L${cx.toFixed(1)} ${(cy + dR).toFixed(1)}` +
        `L${(cx - dR).toFixed(1)} ${cy.toFixed(1)}Z`;
      // Center boss.
      const br = r * 0.55;
      bosses +=
        `M${(cx - br).toFixed(1)} ${cy.toFixed(1)}` +
        `a${br.toFixed(1)} ${br.toFixed(1)} 0 1 0 ${(br * 2).toFixed(1)} 0` +
        `a${br.toFixed(1)} ${br.toFixed(1)} 0 1 0 ${(-br * 2).toFixed(1)} 0Z`;
    }
  }
  g.appendChild(svgEl('path', {d: petals, fill: fg, 'fill-rule': 'nonzero'}));
  g.appendChild(svgEl('path', {d: bosses, fill: accent}));
  return g;
}

registerGenerator({name: 'ornament-grid', category: 'decorative', weight: 2, render});
