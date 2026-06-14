/**
 * Art Deco starburst: a sharp many-pointed star radiating from center, framed
 * by concentric stepped outlines, in the polished sunburst-clock deco style.
 * Long and short rays alternate for a faceted metallic look; the whole burst is
 * tiled large enough to fill the region.
 */
import {registerGenerator} from '../core/registry.js';
import {DesignContext, Rect} from '../core/types.js';
import {baseFill, clipped, palettePair, svgEl} from './_generator.js';

function render(ctx: DesignContext, bounds: Rect): SVGElement {
  const {rng, palette} = ctx;
  const {bg, fg} = palettePair(ctx, rng);
  const alt = palette.accent === fg ? palette.primary : palette.accent;
  const g = clipped(ctx, bounds);
  baseFill(g, bounds, bg);

  const cx = bounds.x + bounds.w / 2;
  const cy = bounds.y + bounds.h / 2;
  const outer = Math.hypot(bounds.w, bounds.h) * 0.62;

  const points = rng.int(10, 18);
  const total = points * 2;
  const step = (Math.PI * 2) / total;
  const start = -Math.PI / 2;
  const inner = outer * rng.range(0.32, 0.5);

  // Spiked star as a single path: alternate outer tips and inner valleys.
  let star = '';
  for (let i = 0; i <= total; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = start + i * step;
    const x = (cx + r * Math.cos(a)).toFixed(1);
    const y = (cy + r * Math.sin(a)).toFixed(1);
    star += `${i === 0 ? 'M' : 'L'}${x} ${y}`;
  }
  star += 'Z';
  g.appendChild(svgEl('path', {d: star, fill: fg}));

  // Concentric stepped ring outlines around the core for the deco framing.
  const rings = rng.int(3, 5);
  const stroke = Math.max(1.5, outer * 0.012);
  for (let i = 1; i <= rings; i++) {
    const r = inner * (i / (rings + 1));
    g.appendChild(svgEl('circle', {cx, cy, r, fill: 'none', stroke: alt, 'stroke-width': stroke}));
  }
  // Center disc.
  g.appendChild(svgEl('circle', {cx, cy, r: inner * 0.28, fill: alt}));
  return g;
}

registerGenerator({name: 'starburst-deco', category: 'geometric', weight: 2, render});
