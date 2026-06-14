/**
 * Plaid / tartan: sets of translucent vertical and horizontal bands of varying
 * width crossing one another. Where bands overlap the colors multiply visually
 * via opacity, producing the woven grid of a tartan cloth.
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
  // A repeating sett: a sequence of (color, width fraction) bands.
  const settSize = rng.int(3, 6);
  const sett: Array<{color: Color; w: number}> = [];
  for (let i = 0; i < settSize; i++) {
    sett.push({color: rng.pick(tones), w: rng.range(0.4, 2)});
  }
  const settTotal = sett.reduce((s, b) => s + b.w, 0);
  const baseUnit = bounds.w / rng.range(5, 12);
  const opacity = rng.range(0.45, 0.7).toFixed(2);

  // Vertical bands.
  let x = bounds.x;
  let i = 0;
  while (x < bounds.x + bounds.w) {
    const band = sett[i % sett.length];
    const w = (band.w / settTotal) * settSize * baseUnit;
    g.appendChild(
      svgEl('rect', {
        x, y: bounds.y, width: w, height: bounds.h,
        fill: band.color, 'fill-opacity': opacity,
      }),
    );
    x += w;
    i++;
  }
  // Horizontal bands using the same sett for a balanced tartan.
  let y = bounds.y;
  i = 0;
  while (y < bounds.y + bounds.h) {
    const band = sett[i % sett.length];
    const h = (band.w / settTotal) * settSize * baseUnit;
    g.appendChild(
      svgEl('rect', {
        x: bounds.x, y, width: bounds.w, height: h,
        fill: band.color, 'fill-opacity': opacity,
      }),
    );
    y += h;
    i++;
  }
  return g;
}

registerGenerator({name: 'plaid', category: 'tiling', weight: 2, render});
