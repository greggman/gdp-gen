/**
 * Dot spiral: dots placed along an Archimedean (or golden-angle) spiral that
 * winds out from the center, a hypnotic phyllotaxis-style motif.
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
  const maxR = Math.hypot(bounds.w, bounds.h) / 2;
  const golden = rng.chance(0.5);
  const count = rng.int(300, 900);
  const angleStep = golden ? 2.399963 : rng.range(0.25, 0.6);
  const spacing = maxR / Math.sqrt(count);
  const minDot = Math.min(bounds.w, bounds.h) * 0.004;
  const maxDot = Math.min(bounds.w, bounds.h) * rng.range(0.012, 0.03);
  const grow = rng.chance(0.6);

  let d = '';
  for (let i = 0; i < count; i++) {
    const r = golden ? spacing * Math.sqrt(i) : spacing * i * 0.5;
    if (r > maxR) break;
    const a = i * angleStep;
    const x = cx + Math.cos(a) * r;
    const y = cy + Math.sin(a) * r;
    const t = r / maxR;
    const radius = grow ? minDot + (maxDot - minDot) * t : maxDot - (maxDot - minDot) * t;
    d += `M${x.toFixed(1)} ${y.toFixed(1)}m${-radius} 0a${radius} ${radius} 0 1 0 ${radius * 2} 0a${radius} ${radius} 0 1 0 ${-radius * 2} 0`;
  }
  g.appendChild(svgEl('path', {d, fill: fg}));
  return g;
}

registerGenerator({name: 'dot-spiral', category: 'dots', weight: 2, render});
