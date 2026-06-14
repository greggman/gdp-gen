/**
 * Truncated-hexagon + square tiling: the semiregular 4.6.12-ish look built the
 * simple way -- a grid of octagon-like truncated hexagons with small squares
 * filling the gaps between them. Hexes are fg, the interstitial squares accent,
 * over a bg field, giving a crisp tiled-floor pattern.
 */
import {registerGenerator} from '../core/registry.js';
import {DesignContext, Rect} from '../core/types.js';
import {baseFill, clipped, palettePair, svgEl} from './_generator.js';

function render(ctx: DesignContext, bounds: Rect): SVGElement {
  const {rng, palette} = ctx;
  const {bg, fg} = palettePair(ctx, rng);
  const sq = fg === palette.accent ? palette.primary : palette.accent;
  const g = clipped(ctx, bounds);
  baseFill(g, bounds, bg);

  const cols = rng.int(3, 6);
  const step = bounds.w / cols; // Center-to-center spacing.
  const rows = Math.ceil(bounds.h / step) + 2;
  const t = step * 0.30; // Truncation: corner cut size -> octagonal hexes.
  const half = step / 2;
  const r = half - t * 0.15; // Outer reach of the truncated shape.

  let hexD = '';
  let sqD = '';
  for (let row = -1; row < rows; row++) {
    const cy = bounds.y + row * step;
    for (let col = -1; col <= cols; col++) {
      const cx = bounds.x + col * step;
      // Octagon (truncated square approximating a truncated hex cell).
      const o = r - t;
      hexD +=
        `M${cx - o} ${cy - r}` +
        `L${cx + o} ${cy - r}` +
        `L${cx + r} ${cy - o}` +
        `L${cx + r} ${cy + o}` +
        `L${cx + o} ${cy + r}` +
        `L${cx - o} ${cy + r}` +
        `L${cx - r} ${cy + o}` +
        `L${cx - r} ${cy - o}Z`;
      // Small square nestled in the gap at the bottom-right corner junction.
      const gx = cx + half;
      const gy = cy + half;
      const s = t * 0.9;
      sqD += `M${gx - s} ${gy - s}h${2 * s}v${2 * s}h${-2 * s}z`;
    }
  }
  g.appendChild(svgEl('path', {d: hexD, fill: fg}));
  g.appendChild(svgEl('path', {d: sqD, fill: sq}));
  return g;
}

registerGenerator({name: 'hexagon-truncated', category: 'geometric', weight: 2, render});
