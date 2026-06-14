/**
 * Marquee bulbs: rows of theater-marquee light bulbs, each a bright dot with a
 * soft halo and a small socket, evoking a cinema or carnival sign. Bulbs
 * alternate lit/dim to suggest a chase pattern.
 */
import {registerGenerator} from '../core/registry.js';
import {DesignContext, Rect} from '../core/types.js';
import {baseFill, clipped, palettePair, svgEl} from './_generator.js';

function render(ctx: DesignContext, bounds: Rect): SVGElement {
  const {rng} = ctx;
  const {bg, fg} = palettePair(ctx, rng);
  const g = clipped(ctx, bounds);
  baseFill(g, bounds, bg);

  const cols = rng.int(8, 16);
  const step = bounds.w / cols;
  const rows = Math.max(1, Math.round(bounds.h / step));
  const rh = bounds.h / rows;
  const bulbR = Math.min(step, rh) * rng.range(0.2, 0.3);
  const phase = rng.int(2, 3);
  const litChance = rng.range(0.55, 0.75);

  const halos = svgEl('g', {fill: fg, 'fill-opacity': '0.22'});
  const bulbsLit = svgEl('g', {fill: fg});
  const bulbsDim = svgEl('g', {fill: fg, 'fill-opacity': '0.4'});

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cx = bounds.x + (c + 0.5) * step;
      const cy = bounds.y + (r + 0.5) * rh;
      const lit = (c + r) % phase === 0 ? true : rng.chance(litChance);
      if (lit) {
        halos.appendChild(circle(cx, cy, bulbR * 2));
        bulbsLit.appendChild(circle(cx, cy, bulbR));
      } else {
        bulbsDim.appendChild(circle(cx, cy, bulbR));
      }
    }
  }
  g.appendChild(halos);
  g.appendChild(bulbsDim);
  g.appendChild(bulbsLit);
  return g;
}

function circle(cx: number, cy: number, r: number): SVGElement {
  return svgEl('circle', {cx: cx.toFixed(1), cy: cy.toFixed(1), r: r.toFixed(1)});
}

registerGenerator({name: 'marquee-bulbs', category: 'retro', weight: 2, render});
