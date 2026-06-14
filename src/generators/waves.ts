/** Stacked sine waves filling the region as smooth horizontal bands. */
import {registerGenerator} from '../core/registry.js';
import {DesignContext, Rect} from '../core/types.js';
import {baseFill, clipped, palettePair, svgEl} from './_generator.js';

function render(ctx: DesignContext, bounds: Rect): SVGElement {
  const {rng} = ctx;
  const {bg, fg} = palettePair(ctx, rng);
  const g = clipped(ctx, bounds);
  baseFill(g, bounds, bg);

  const bands = rng.int(4, 12);
  const bandH = bounds.h / bands;
  const amp = bandH * rng.range(0.4, 1.1);
  const periods = rng.range(1, 4);
  const phase = rng.range(0, Math.PI * 2);
  const steps = 40;

  for (let i = 0; i <= bands; i++) {
    const baseY = bounds.y + i * bandH;
    let d = `M ${bounds.x} ${bounds.y + bounds.h} L ${bounds.x} ${baseY}`;
    for (let s = 0; s <= steps; s++) {
      const x = bounds.x + (s / steps) * bounds.w;
      const y = baseY + Math.sin((s / steps) * periods * Math.PI * 2 + phase + i) * amp;
      d += ` L ${x.toFixed(1)} ${y.toFixed(1)}`;
    }
    d += ` L ${bounds.x + bounds.w} ${bounds.y + bounds.h} Z`;
    g.appendChild(svgEl('path', {d, fill: i % 2 === 0 ? fg : bg}));
  }
  return g;
}

registerGenerator({name: 'waves', category: 'waves', weight: 2, render});
