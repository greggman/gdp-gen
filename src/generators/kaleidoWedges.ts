/**
 * Kaleidoscope wedges: one random wedge of marks is mirrored and rotated around
 * the center to fill a full circle with symmetric, kaleidoscopic geometry.
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
  const segments = rng.int(6, 12);
  const wedge = (Math.PI * 2) / segments;
  const colors: Color[] = rng.sample(
    [fg, palette.accent, palette.primary, ...palette.colors],
    rng.int(2, 4),
  );

  // Build a motif of triangles within a single wedge (angles in [0, wedge)).
  interface Tri {
    a0: number;
    r0: number;
    a1: number;
    r1: number;
    a2: number;
    r2: number;
    color: Color;
  }
  const motif: Tri[] = [];
  const shapes = rng.int(3, 6);
  for (let i = 0; i < shapes; i++) {
    motif.push({
      a0: rng.range(0, wedge),
      r0: rng.range(0, maxR),
      a1: rng.range(0, wedge),
      r1: rng.range(0, maxR),
      a2: rng.range(0, wedge),
      r2: rng.range(0, maxR),
      color: rng.pick(colors),
    });
  }

  const start = rng.range(0, Math.PI * 2);
  for (let s = 0; s < segments; s++) {
    const base = start + s * wedge;
    const flip = s % 2 === 1; // mirror alternate wedges
    for (const t of motif) {
      const sign = flip ? -1 : 1;
      const a0 = base + sign * t.a0;
      const a1 = base + sign * t.a1;
      const a2 = base + sign * t.a2;
      const p = (a: number, r: number) =>
        `${(cx + Math.cos(a) * r).toFixed(2)},${(cy + Math.sin(a) * r).toFixed(2)}`;
      g.appendChild(
        svgEl('polygon', {
          points: `${p(a0, t.r0)} ${p(a1, t.r1)} ${p(a2, t.r2)}`,
          fill: t.color,
          'fill-opacity': '0.85',
        }),
      );
    }
  }
  return g;
}

registerGenerator({name: 'kaleido-wedges', category: 'radial', weight: 2, render});
