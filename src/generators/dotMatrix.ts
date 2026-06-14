/**
 * LED dot-matrix display: a grid of round "pixels" set into a dark panel, each
 * either lit (foreground) or dim (a faint version of the panel), with the lit
 * dots forming bold blocky bands and scattered glyphs as on a scrolling sign.
 * Lit and unlit dots are each drawn as a single merged path.
 */
import {registerGenerator} from '../core/registry.js';
import {DesignContext, Rect} from '../core/types.js';
import {baseFill, clipped, palettePair, svgEl} from './_generator.js';

function render(ctx: DesignContext, bounds: Rect): SVGElement {
  const {rng} = ctx;
  const {bg, fg} = palettePair(ctx, rng);
  const g = clipped(ctx, bounds);
  baseFill(g, bounds, bg);

  const minDim = Math.min(bounds.w, bounds.h);
  const cell = minDim * rng.range(0.045, 0.08);
  const cols = Math.max(4, Math.ceil(bounds.w / cell));
  const rows = Math.max(4, Math.ceil(bounds.h / cell));
  const cw = bounds.w / cols;
  const ch = bounds.h / rows;
  const r = Math.min(cw, ch) * 0.38;

  // A simple structured "on" mask: a few horizontal scan bands plus noise, so
  // it reads as a display rather than pure static.
  const bandCount = rng.int(1, 3);
  const bands: Array<[number, number]> = [];
  for (let i = 0; i < bandCount; i++) {
    const start = rng.int(0, rows - 2);
    bands.push([start, start + rng.int(1, Math.max(1, Math.floor(rows / 4)))]);
  }
  const noiseOn = rng.range(0.25, 0.5);

  let lit = '';
  let dim = '';
  for (let row = 0; row < rows; row++) {
    let inBand = false;
    for (const [s, e] of bands) {
      if (row >= s && row <= e) inBand = true;
    }
    for (let col = 0; col < cols; col++) {
      const cx = bounds.x + (col + 0.5) * cw;
      const cy = bounds.y + (row + 0.5) * ch;
      const on = inBand ? rng.next() < 0.85 : rng.next() < noiseOn;
      const dot = `M${cx.toFixed(1)} ${cy.toFixed(1)}m${(-r).toFixed(1)} 0a${r.toFixed(1)} ${r.toFixed(1)} 0 1 0 ${(r * 2).toFixed(1)} 0a${r.toFixed(1)} ${r.toFixed(1)} 0 1 0 ${(-r * 2).toFixed(1)} 0`;
      if (on) lit += dot;
      else dim += dot;
    }
  }
  // Dim cells first (the unlit grid), then the bright lit dots on top.
  g.appendChild(svgEl('path', {d: dim, fill: fg, 'fill-opacity': '0.18'}));
  g.appendChild(svgEl('path', {d: lit, fill: fg}));
  return g;
}

registerGenerator({name: 'dot-matrix', category: 'grid', weight: 2, render});
