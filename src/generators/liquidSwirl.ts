/**
 * Liquid paint swirl: a single thick ribbon spiraling inward from the edge to a
 * center, its width tapering as it coils, evoking stirred paint. A few fainter
 * trailing arcs add motion. Drawn as filled spiral bands so it reads boldly.
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

  const cx = bounds.x + bounds.w / 2 + rng.range(-0.1, 0.1) * bounds.w;
  const cy = bounds.y + bounds.h / 2 + rng.range(-0.1, 0.1) * bounds.h;
  const maxR = Math.hypot(bounds.w, bounds.h) * 0.62;
  const turns = rng.range(3.5, 5.5);
  const dir = rng.chance() ? 1 : -1;
  const steps = 360;
  const total = turns * Math.PI * 2;

  // Two interleaved spirals (one per color) for a swirled, two-tone vortex.
  const spiral = (phase: number, color: string, wScale: number): string => {
    const inner: string[] = [];
    const outer: string[] = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const ang = dir * t * total + phase;
      const r = maxR * (1 - t) * (1 - t * 0.05);
      const w = (8 + 22 * (1 - t)) * wScale;
      const px = cx + Math.cos(ang) * r;
      const py = cy + Math.sin(ang) * r;
      const nx = -Math.sin(ang);
      const ny = Math.cos(ang);
      inner.push((i === 0 ? 'M' : 'L') + (px + nx * w).toFixed(1) + ' ' + (py + ny * w).toFixed(1));
      outer.push('L' + (px - nx * w).toFixed(1) + ' ' + (py - ny * w).toFixed(1));
    }
    outer.reverse();
    return inner.join('') + outer.join('') + 'Z';
  };

  g.appendChild(svgEl('path', {d: spiral(0, fg, 1), fill: fg}));
  g.appendChild(svgEl('path', {d: spiral(Math.PI, alt, 0.6), fill: alt, 'fill-opacity': 0.9}));
  return g;
}

registerGenerator({name: 'liquid-swirl', category: 'organic', weight: 2, render});
