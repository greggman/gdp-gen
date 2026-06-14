/**
 * Bauhaus shapes: a small set of bold primitives (circles, half-circles,
 * triangles, bars) placed on a coarse grid in primary palette colors.
 */
import {registerGenerator} from '../core/registry.js';
import {Color, DesignContext, Rect} from '../core/types.js';
import {baseFill, clipped, palettePair, svgEl} from './_generator.js';

function render(ctx: DesignContext, bounds: Rect): SVGElement {
  const {rng, palette} = ctx;
  const {bg} = palettePair(ctx, rng);
  const g = clipped(ctx, bounds);
  baseFill(g, bounds, bg);

  const colors: Color[] = [palette.primary, palette.accent, palette.colors[3] ?? palette.primary];
  const cols = rng.int(3, 5);
  const rows = Math.max(2, Math.round((cols * bounds.h) / bounds.w));
  const cw = bounds.w / cols;
  const ch = bounds.h / rows;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (rng.chance(0.2)) continue; // leave some negative space
      const x = bounds.x + c * cw;
      const y = bounds.y + r * ch;
      const fill = rng.pick(colors);
      const kind = rng.pick(['circle', 'half', 'triangle', 'bar', 'quarter'] as const);
      const cx = x + cw / 2;
      const cy = y + ch / 2;
      const rad = Math.min(cw, ch) / 2;
      switch (kind) {
        case 'circle':
          g.appendChild(svgEl('circle', {cx, cy, r: rad, fill}));
          break;
        case 'half':
          g.appendChild(
            svgEl('path', {d: `M ${cx - rad} ${cy} a ${rad} ${rad} 0 0 1 ${rad * 2} 0 Z`, fill}),
          );
          break;
        case 'triangle':
          g.appendChild(
            svgEl('polygon', {points: `${x} ${y + ch} ${x + cw} ${y + ch} ${cx} ${y}`, fill}),
          );
          break;
        case 'bar': {
          const vertical = rng.chance(0.5);
          g.appendChild(
            svgEl('rect', {
              x: vertical ? cx - cw * 0.18 : x,
              y: vertical ? y : cy - ch * 0.18,
              width: vertical ? cw * 0.36 : cw,
              height: vertical ? ch : ch * 0.36,
              fill,
            }),
          );
          break;
        }
        case 'quarter':
          g.appendChild(
            svgEl('path', {
              d: `M ${x} ${y + ch} L ${x} ${y} A ${cw} ${ch} 0 0 1 ${x + cw} ${y + ch} Z`,
              fill,
            }),
          );
          break;
      }
    }
  }
  return g;
}

registerGenerator({name: 'bauhaus', category: 'bauhaus', weight: 2, render});
