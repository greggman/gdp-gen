/**
 * Squiggles: rows of hand-drawn-looking wavy lines that wander across the
 * region, each a smooth chain of quadratic bumps. Casual and energetic, like
 * marker doodles on a postmodern poster.
 */
import {registerGenerator} from '../core/registry.js';
import {Color, DesignContext, Rect} from '../core/types.js';
import {baseFill, clipped, palettePair, svgEl} from './_generator.js';

function render(ctx: DesignContext, bounds: Rect): SVGElement {
  const {rng, palette} = ctx;
  const {bg, fg} = palettePair(ctx, rng);
  const g = clipped(ctx, bounds);
  baseFill(g, bounds, bg);

  const inks: Color[] = [fg, palette.accent, palette.colors[2] ?? fg];
  const rows = rng.int(5, 14);
  const rowH = bounds.h / rows;
  const amp = rowH * rng.range(0.18, 0.42);
  const bumps = Math.max(3, Math.min(40, Math.round(bounds.w / (rowH * 0.9))));
  const stepX = (bounds.w + amp * 4) / bumps;
  const stroke = Math.max(1.5, rowH * rng.range(0.1, 0.22));

  for (let r = 0; r < rows; r++) {
    const yBase = bounds.y + rowH * (r + 0.5);
    const phase = rng.next() * Math.PI * 2;
    const a = amp * rng.range(0.7, 1.2);
    let d = `M ${(bounds.x - amp * 2).toFixed(1)} ${yBase.toFixed(1)}`;
    let dir = rng.chance() ? 1 : -1;
    for (let i = 0; i < bumps; i++) {
      const x0 = bounds.x - amp * 2 + i * stepX;
      const cx = x0 + stepX / 2;
      const ex = x0 + stepX;
      const cy = yBase + dir * a * Math.sin(phase + i);
      d += ` Q ${cx.toFixed(1)} ${cy.toFixed(1)} ${ex.toFixed(1)} ${yBase.toFixed(1)}`;
      dir = -dir;
    }
    g.appendChild(
      svgEl('path', {
        d,
        fill: 'none',
        stroke: rng.pick(inks),
        'stroke-width': stroke,
        'stroke-linecap': 'round',
      }),
    );
  }
  return g;
}

registerGenerator({name: 'squiggles', category: 'memphis', weight: 2, render});
