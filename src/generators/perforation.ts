/**
 * Perforation: a punched-hole grid -- a solid foreground panel with a regular
 * lattice of holes knocked out, like perforated metal or a player-piano roll.
 */
import {registerGenerator} from '../core/registry.js';
import {DesignContext, Rect} from '../core/types.js';
import {baseFill, clipped, palettePair, svgEl} from './_generator.js';

function render(ctx: DesignContext, bounds: Rect): SVGElement {
  const {rng} = ctx;
  const {bg, fg} = palettePair(ctx, rng);
  const g = clipped(ctx, bounds);
  // Background shows through the punched holes.
  baseFill(g, bounds, bg);

  const cols = rng.int(10, 24);
  const step = bounds.w / cols;
  const rows = Math.max(1, Math.round(bounds.h / step));
  const radius = step * rng.range(0.2, 0.36);
  const stagger = rng.chance(0.5);

  // One path: outer panel rectangle (CW) plus holes (CCW) with evenodd fill.
  let d = `M${bounds.x} ${bounds.y}h${bounds.w}v${bounds.h}h${-bounds.w}z`;
  for (let r = 0; r <= rows; r++) {
    const off = stagger && r % 2 === 1 ? step / 2 : 0;
    for (let c = 0; c <= cols; c++) {
      const cx = (bounds.x + off + c * step).toFixed(1);
      const cy = (bounds.y + r * step).toFixed(1);
      d += `M${cx} ${cy}m${-radius} 0a${radius} ${radius} 0 1 0 ${radius * 2} 0a${radius} ${radius} 0 1 0 ${-radius * 2} 0`;
    }
  }
  g.appendChild(svgEl('path', {d, fill: fg, 'fill-rule': 'evenodd'}));
  return g;
}

registerGenerator({name: 'perforation', category: 'dots', weight: 2, render});
