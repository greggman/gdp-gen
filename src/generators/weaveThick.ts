/**
 * Bold over-under weave: fat horizontal and vertical bands crossing in a grid,
 * where at each intersection one band passes over the other in a strict
 * checkerboard of over/under, giving a thick basket-weave / plaid-ribbon look.
 * Bands are fg/accent; shadow slivers at the "under" edges sell the depth.
 */
import {registerGenerator} from '../core/registry.js';
import {DesignContext, Rect} from '../core/types.js';
import {baseFill, clipped, palettePair, svgEl} from './_generator.js';

function render(ctx: DesignContext, bounds: Rect): SVGElement {
  const {rng, palette} = ctx;
  const {bg, fg} = palettePair(ctx, rng);
  const vColor = fg === palette.accent ? palette.primary : palette.accent;
  const g = clipped(ctx, bounds);
  baseFill(g, bounds, bg);

  const cols = rng.int(3, 6);
  const pitch = bounds.w / cols; // Spacing of band centers.
  const band = pitch * 0.62; // Thick bands; gaps between for the weave.
  const rows = Math.ceil(bounds.h / pitch) + 1;
  const gap = (pitch - band) / 2;

  // Draw all horizontal bands, then all vertical bands. To get over-under, at
  // each cell we overdraw the appropriate band's segment last.
  const hY = (r: number) => bounds.y + r * pitch + gap;
  const vX = (c: number) => bounds.x + c * pitch + gap;

  // Base: full horizontal strips.
  let hD = '';
  for (let r = -1; r < rows; r++) {
    hD += `M${bounds.x} ${hY(r)}h${bounds.w}v${band}h${-bounds.w}z`;
  }
  g.appendChild(svgEl('path', {d: hD, fill: fg}));

  // Vertical strips on top.
  let vD = '';
  for (let c = -1; c <= cols; c++) {
    vD += `M${vX(c)} ${bounds.y}v${bounds.h}h${band}v${-bounds.h}z`;
  }
  g.appendChild(svgEl('path', {d: vD, fill: vColor}));

  // Over-under: at cells where the horizontal should pass OVER, redraw the
  // horizontal segment covering the vertical band. Checkerboard parity.
  let overD = '';
  for (let r = -1; r < rows; r++) {
    for (let c = -1; c <= cols; c++) {
      if (((r + c) & 1) === 0) continue;
      const y = hY(r);
      const x = vX(c) - gap;
      overD += `M${x} ${y}h${pitch}v${band}h${-pitch}z`;
    }
  }
  g.appendChild(svgEl('path', {d: overD, fill: fg}));

  // Thin shadow slivers along each vertical band's left edge at "under" cells
  // to deepen the woven illusion.
  let shD = '';
  const sh = Math.max(1, band * 0.12);
  for (let r = -1; r < rows; r++) {
    for (let c = -1; c <= cols; c++) {
      if (((r + c) & 1) === 0) continue;
      const y = hY(r);
      const x = vX(c);
      shD += `M${x} ${y}h${sh}v${band}h${-sh}z`;
      shD += `M${x + band - sh} ${y}h${sh}v${band}h${-sh}z`;
    }
  }
  g.appendChild(svgEl('path', {d: shD, fill: bg, opacity: 0.28}));
  return g;
}

registerGenerator({name: 'weave-thick', category: 'geometric', weight: 2, render});
