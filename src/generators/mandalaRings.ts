/**
 * Mandala rings: layered concentric rings, each decorated with a ring of small
 * repeated marks (dots or petals). Counts and radii step outward to build an
 * ornamental, symmetric mandala.
 */
import {registerGenerator} from '../core/registry.js';
import {Color, DesignContext, Rect} from '../core/types.js';
import {baseFill, clipped, palettePair, svgEl} from './_generator.js';

function render(ctx: DesignContext, bounds: Rect): SVGElement {
  const {rng, palette} = ctx;
  const {bg, fg} = palettePair(ctx, rng);
  const g = clipped(ctx, bounds);
  baseFill(g, bounds, bg);

  const cx = bounds.x + bounds.w / 2;
  const cy = bounds.y + bounds.h / 2;
  const maxR = Math.hypot(bounds.w, bounds.h) / 2;
  const layers = rng.int(4, 8);
  const baseCount = rng.int(8, 16);
  const colors: Color[] = [fg, palette.accent, palette.primary];

  for (let l = 1; l <= layers; l++) {
    const r = (l / layers) * maxR;
    const count = baseCount + l * rng.int(0, 4);
    const phase = rng.range(0, Math.PI * 2);
    const dot = (maxR / layers) * rng.range(0.15, 0.4);
    const color = colors[l % colors.length];
    const petal = rng.chance(0.5);

    let d = '';
    for (let i = 0; i < count; i++) {
      const a = phase + (i / count) * Math.PI * 2;
      const px = cx + Math.cos(a) * r;
      const py = cy + Math.sin(a) * r;
      if (petal) {
        // A small lens/petal pointing outward from the center.
        const tip = dot * 1.8;
        const tx = (px + Math.cos(a) * tip).toFixed(2);
        const ty = (py + Math.sin(a) * tip).toFixed(2);
        const bx = (px - Math.cos(a) * tip).toFixed(2);
        const by = (py - Math.sin(a) * tip).toFixed(2);
        d += `M${bx} ${by}Q${(px + Math.cos(a + Math.PI / 2) * dot).toFixed(2)} ${(
          py +
          Math.sin(a + Math.PI / 2) * dot
        ).toFixed(2)} ${tx} ${ty}Q${(px + Math.cos(a - Math.PI / 2) * dot).toFixed(2)} ${(
          py +
          Math.sin(a - Math.PI / 2) * dot
        ).toFixed(2)} ${bx} ${by}Z`;
      } else {
        d += `M${px.toFixed(2)} ${py.toFixed(2)}m${-dot.toFixed(2)} 0a${dot.toFixed(
          2,
        )} ${dot.toFixed(2)} 0 1 0 ${(dot * 2).toFixed(2)} 0a${dot.toFixed(2)} ${dot.toFixed(
          2,
        )} 0 1 0 ${(-dot * 2).toFixed(2)} 0z`;
      }
    }
    g.appendChild(svgEl('path', {d, fill: color}));
  }
  return g;
}

registerGenerator({name: 'mandala-rings', category: 'radial', weight: 2, render});
