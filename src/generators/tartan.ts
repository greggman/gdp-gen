/**
 * Tartan plaid: overlapping semi-transparent warp and weft bands in a repeating
 * sett. Crossing bands multiply into darker squares, and thin overcheck lines
 * accent the blocks -- the structure of a woven Scottish tartan.
 */
import {registerGenerator} from '../core/registry.js';
import {Color, DesignContext, Rect} from '../core/types.js';
import {baseFill, clipped, palettePair, svgEl} from './_generator.js';

interface Band {
  color: Color;
  width: number;
  opacity: number;
}

function render(ctx: DesignContext, bounds: Rect): SVGElement {
  const {rng, palette} = ctx;
  const {bg, fg} = palettePair(ctx, rng);
  const g = clipped(ctx, bounds);
  baseFill(g, bounds, bg);

  // Build a sett: a repeating sequence of colored bands.
  const colors: Color[] = [fg, palette.accent, palette.primary];
  const unit = Math.min(bounds.w, bounds.h) / rng.int(5, 9);
  const sett: Band[] = [];
  const settLen = rng.int(3, 5);
  for (let i = 0; i < settLen; i++) {
    sett.push({
      color: rng.pick(colors),
      width: unit * rng.range(0.4, 1.4),
      opacity: rng.range(0.35, 0.6),
    });
  }
  const thin: Band = {color: rng.pick(colors), width: Math.max(1, unit * 0.12), opacity: 0.8};

  // Vertical bands (warp), then horizontal (weft) on top; overlap darkens.
  layBands(g, bounds, sett, thin, false);
  layBands(g, bounds, sett, thin, true);
  return g;
}

function layBands(
  g: SVGElement,
  bounds: Rect,
  sett: Band[],
  thin: Band,
  horizontal: boolean,
): void {
  const span = horizontal ? bounds.h : bounds.w;
  const cross = horizontal ? bounds.w : bounds.h;
  const start = horizontal ? bounds.y : bounds.x;
  const crossStart = horizontal ? bounds.x : bounds.y;
  let pos = start;
  let i = 0;
  while (pos < start + span) {
    const band = sett[i % sett.length];
    const w = Math.min(band.width, start + span - pos);
    const attrs: Record<string, string | number> = {
      fill: band.color,
      'fill-opacity': band.opacity.toFixed(2),
    };
    if (horizontal) {
      Object.assign(attrs, {
        x: crossStart,
        y: pos.toFixed(1),
        width: cross,
        height: w.toFixed(1),
      });
    } else {
      Object.assign(attrs, {
        x: pos.toFixed(1),
        y: crossStart,
        width: w.toFixed(1),
        height: cross,
      });
    }
    g.appendChild(svgEl('rect', attrs));
    // Thin overcheck line at the band boundary every few bands.
    if (i % sett.length === 0) {
      const lineAttrs: Record<string, string | number> = {
        fill: thin.color,
        'fill-opacity': thin.opacity.toFixed(2),
      };
      if (horizontal) {
        Object.assign(lineAttrs, {x: crossStart, y: pos.toFixed(1), width: cross, height: thin.width.toFixed(1)});
      } else {
        Object.assign(lineAttrs, {x: pos.toFixed(1), y: crossStart, width: thin.width.toFixed(1), height: cross});
      }
      g.appendChild(svgEl('rect', lineAttrs));
    }
    pos += w;
    i++;
  }
}

registerGenerator({name: 'tartan', category: 'retro', weight: 2, render});
