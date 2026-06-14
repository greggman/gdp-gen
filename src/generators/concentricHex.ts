/**
 * Concentric hexagon rings: nested flat-top hexagons shrinking toward a shared
 * center, with alternating fill so the rings read as a bold hexagonal target.
 */
import {registerGenerator} from '../core/registry.js';
import {DesignContext, Rect} from '../core/types.js';
import {baseFill, clipped, palettePair, svgEl} from './_generator.js';

function render(ctx: DesignContext, bounds: Rect): SVGElement {
  const {rng} = ctx;
  const {bg, fg} = palettePair(ctx, rng);
  const g = clipped(ctx, bounds);
  baseFill(g, bounds, bg);

  const cx = bounds.x + bounds.w / 2;
  const cy = bounds.y + bounds.h / 2;
  const r0 = Math.hypot(bounds.w, bounds.h) * 0.62;
  const flat = rng.chance(); // flat-top vs pointy-top orientation.
  const rings = rng.int(7, 13);

  const hex = (r: number): string => {
    let d = '';
    for (let k = 0; k < 6; k++) {
      const a = (k * Math.PI) / 3 + (flat ? 0 : Math.PI / 6);
      const px = (cx + Math.cos(a) * r).toFixed(1);
      const py = (cy + Math.sin(a) * r).toFixed(1);
      d += (k === 0 ? 'M' : 'L') + px + ' ' + py;
    }
    return d + 'z';
  };

  for (let i = 0; i < rings; i++) {
    const r = r0 * (1 - i / rings);
    if (r < 1) break;
    g.appendChild(svgEl('path', {d: hex(r), fill: i % 2 === 0 ? fg : bg}));
  }
  return g;
}

registerGenerator({name: 'concentric-hex', category: 'geometric', weight: 2, render});
