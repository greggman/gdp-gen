/**
 * Risograph overlap: two offset layers of bold blobs printed in different
 * spot colors. The layers are slightly misaligned and use multiply-like
 * opacity so the overlapping region reads as a third, darker ink -- the
 * signature look of riso printing.
 */
import {registerGenerator} from '../core/registry.js';
import {Rng} from '../core/rng.js';
import {Color, DesignContext, Rect} from '../core/types.js';
import {baseFill, clipped, palettePair, svgEl} from './_generator.js';

function blobLayer(
  rng: Rng,
  bounds: Rect,
  color: Color,
  dx: number,
  dy: number,
): SVGGElement {
  const layer = svgEl('g', {
    transform: `translate(${dx.toFixed(1)} ${dy.toFixed(1)})`,
    fill: color,
    'fill-opacity': '0.75',
  });
  const cols = 3;
  const rows = Math.max(2, Math.round((cols * bounds.h) / bounds.w));
  const cw = bounds.w / cols;
  const ch = bounds.h / rows;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (rng.chance(0.25)) continue;
      const cx = bounds.x + (c + 0.5) * cw + rng.gaussian(0, cw * 0.12);
      const cy = bounds.y + (r + 0.5) * ch + rng.gaussian(0, ch * 0.12);
      const rad = Math.min(cw, ch) * rng.range(0.34, 0.55);
      layer.appendChild(svgEl('circle', {cx: cx.toFixed(1), cy: cy.toFixed(1), r: rad.toFixed(1)}));
    }
  }
  return layer;
}

function render(ctx: DesignContext, bounds: Rect): SVGElement {
  const {rng, palette} = ctx;
  const {bg, fg} = palettePair(ctx, rng);
  const g = clipped(ctx, bounds);
  baseFill(g, bounds, bg);

  const second = palette.accent === fg ? palette.primary : palette.accent;
  const off = Math.min(bounds.w, bounds.h) * rng.range(0.02, 0.05);
  g.appendChild(blobLayer(rng, bounds, fg, -off, -off * rng.range(0.4, 1)));
  g.appendChild(blobLayer(rng, bounds, second, off, off * rng.range(0.4, 1)));
  return g;
}

registerGenerator({name: 'riso-overlap', category: 'print', weight: 2, render});
