/**
 * Neon tubes: a few continuous bent "tube" strokes that glow against a dark
 * field. Each tube is drawn three times -- a wide soft halo, a mid glow, and a
 * bright thin core -- to fake the bloom of lit gas tubing.
 */
import {registerGenerator} from '../core/registry.js';
import {Rng} from '../core/rng.js';
import {Color, DesignContext, Rect} from '../core/types.js';
import {baseFill, clipped, palettePair, svgEl} from './_generator.js';

function render(ctx: DesignContext, bounds: Rect): SVGElement {
  const {rng, palette} = ctx;
  const {bg, fg} = palettePair(ctx, rng);
  const g = clipped(ctx, bounds);
  // Neon reads best on a dark ground; prefer the darker of the pair.
  const dark = palette.backgroundIsDark ? palette.background : bg;
  baseFill(g, bounds, dark);

  const tubes = rng.int(3, 6);
  const minDim = Math.min(bounds.w, bounds.h);
  const core = Math.max(2, minDim * rng.range(0.012, 0.02));
  const colors: Color[] = [fg, palette.accent, palette.primary];

  for (let t = 0; t < tubes; t++) {
    const color = rng.pick(colors);
    const d = tubePath(rng, bounds);
    const common = {
      d,
      fill: 'none',
      stroke: color,
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
    };
    g.appendChild(svgEl('path', {...common, 'stroke-width': (core * 6).toFixed(1), 'stroke-opacity': '0.18'}));
    g.appendChild(svgEl('path', {...common, 'stroke-width': (core * 3).toFixed(1), 'stroke-opacity': '0.35'}));
    g.appendChild(svgEl('path', {...common, 'stroke-width': core.toFixed(1), 'stroke-opacity': '0.95'}));
  }
  return g;
}

function tubePath(rng: Rng, bounds: Rect): string {
  const segs = rng.int(2, 4);
  const horizontal = rng.chance(0.5);
  let x = bounds.x + rng.range(0.1, 0.4) * bounds.w;
  let y = bounds.y + rng.range(0.1, 0.4) * bounds.h;
  let d = `M${x.toFixed(1)} ${y.toFixed(1)}`;
  for (let i = 0; i < segs; i++) {
    const nx = bounds.x + rng.range(0.1, 0.9) * bounds.w;
    const ny = bounds.y + rng.range(0.1, 0.9) * bounds.h;
    // Quadratic bend with a control point offset for a swooping tube.
    const cx = horizontal ? nx : x;
    const cy = horizontal ? y : ny;
    d += `Q${cx.toFixed(1)} ${cy.toFixed(1)} ${nx.toFixed(1)} ${ny.toFixed(1)}`;
    x = nx;
    y = ny;
  }
  return d;
}

registerGenerator({name: 'neon-tubes', category: 'retro', weight: 2, render});
