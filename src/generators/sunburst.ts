/** Sunburst: alternating wedges radiating from a point. Retro and energetic. */
import {registerGenerator} from '../core/registry.js';
import {DesignContext, Point, Rect} from '../core/types.js';
import {baseFill, clipped, palettePair, svgEl} from './_generator.js';

function onRay(c: Point, angle: number, len: number): string {
  return `${c.x + Math.cos(angle) * len} ${c.y + Math.sin(angle) * len}`;
}

function render(ctx: DesignContext, bounds: Rect): SVGElement {
  const {rng} = ctx;
  const {bg, fg} = palettePair(ctx, rng);
  const g = clipped(ctx, bounds);
  baseFill(g, bounds, bg);

  const c: Point = {
    x: bounds.x + bounds.w * rng.range(0.3, 0.7),
    y: bounds.y + bounds.h * rng.range(0.2, 0.8),
  };
  const len = Math.hypot(bounds.w, bounds.h);
  const wedges = rng.int(8, 32) * 2; // even count so alternation closes cleanly
  const step = (Math.PI * 2) / wedges;
  const phase = rng.range(0, Math.PI);

  for (let i = 0; i < wedges; i += 2) {
    const a0 = phase + i * step;
    const a1 = a0 + step;
    g.appendChild(
      svgEl('polygon', {
        points: `${c.x} ${c.y} ${onRay(c, a0, len)} ${onRay(c, a1, len)}`,
        fill: fg,
      }),
    );
  }
  return g;
}

registerGenerator({name: 'sunburst', category: 'rays', weight: 2, render});
