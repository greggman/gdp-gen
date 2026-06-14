/**
 * Postage-stamp grid: a grid of stamp-shaped tiles, each ringed by the small
 * circular "perforations" punched between stamps. Inner panels alternate ink
 * colors so the sheet reads like a page from a stamp album.
 */
import {registerGenerator} from '../core/registry.js';
import {Color, DesignContext, Rect} from '../core/types.js';
import {baseFill, clipped, palettePair, svgEl} from './_generator.js';

function render(ctx: DesignContext, bounds: Rect): SVGElement {
  const {rng, palette} = ctx;
  const {bg, fg} = palettePair(ctx, rng);
  const g = clipped(ctx, bounds);
  baseFill(g, bounds, bg);

  const cols = rng.int(2, 4);
  const cw = bounds.w / cols;
  const rows = Math.max(2, Math.round(bounds.h / cw));
  const ch = bounds.h / rows;
  const pad = Math.min(cw, ch) * rng.range(0.1, 0.16);
  const perfR = Math.min(cw, ch) * rng.range(0.025, 0.04);
  const ink: Color[] = [fg, palette.accent, palette.primary];

  // Perforation dots are all collected into one path (bg color) so they read
  // as punched holes against the stamp tiles.
  let perf = '';
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = bounds.x + c * cw + pad;
      const y = bounds.y + r * ch + pad;
      const w = cw - pad * 2;
      const h = ch - pad * 2;
      g.appendChild(
        svgEl('rect', {
          x: x.toFixed(1),
          y: y.toFixed(1),
          width: w.toFixed(1),
          height: h.toFixed(1),
          fill: rng.pick(ink),
          rx: (perfR * 0.5).toFixed(1),
        }),
      );
      const along = Math.max(3, Math.round(w / (perfR * 3)));
      const down = Math.max(3, Math.round(h / (perfR * 3)));
      for (let i = 0; i <= along; i++) {
        const px = x + (w * i) / along;
        perf += dot(px, y, perfR) + dot(px, y + h, perfR);
      }
      for (let j = 0; j <= down; j++) {
        const py = y + (h * j) / down;
        perf += dot(x, py, perfR) + dot(x + w, py, perfR);
      }
    }
  }
  g.appendChild(svgEl('path', {d: perf, fill: bg}));
  return g;
}

function dot(cx: number, cy: number, r: number): string {
  return `M${(cx - r).toFixed(1)} ${cy.toFixed(1)}` +
    `a${r.toFixed(1)} ${r.toFixed(1)} 0 1 0 ${(r * 2).toFixed(1)} 0` +
    `a${r.toFixed(1)} ${r.toFixed(1)} 0 1 0 ${(-r * 2).toFixed(1)} 0z`;
}

registerGenerator({name: 'stamp-grid', category: 'print', weight: 2, render});
