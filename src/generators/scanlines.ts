/**
 * Scanlines: closely spaced horizontal CRT lines with a few brighter "glow"
 * bands, recalling an old cathode-ray-tube display.
 */
import {registerGenerator} from '../core/registry.js';
import {DesignContext, Rect} from '../core/types.js';
import {baseFill, clipped, palettePair, svgEl} from './_generator.js';

function render(ctx: DesignContext, bounds: Rect): SVGElement {
  const {rng} = ctx;
  const {bg, fg} = palettePair(ctx, rng);
  const g = clipped(ctx, bounds);
  baseFill(g, bounds, bg);

  const step = Math.max(2.5, bounds.h / rng.int(60, 160));
  const lineH = step * rng.range(0.35, 0.55);
  const right = bounds.x + bounds.w;

  // All scanlines as one path of thin rects.
  let d = '';
  for (let y = bounds.y; y < bounds.y + bounds.h; y += step) {
    d += `M${bounds.x} ${y.toFixed(1)}H${right.toFixed(1)}v${lineH.toFixed(2)}H${bounds.x}z`;
  }
  g.appendChild(svgEl('path', {d, fill: fg, 'fill-opacity': rng.range(0.4, 0.7).toFixed(2)}));

  // Occasional brighter glow bands sweeping across the screen.
  const bands = rng.int(2, 5);
  for (let i = 0; i < bands; i++) {
    const by = bounds.y + rng.next() * bounds.h;
    const bh = step * rng.range(3, 9);
    g.appendChild(
      svgEl('rect', {
        x: bounds.x,
        y: by.toFixed(1),
        width: bounds.w,
        height: bh.toFixed(1),
        fill: fg,
        'fill-opacity': rng.range(0.1, 0.22).toFixed(2),
      }),
    );
  }
  return g;
}

registerGenerator({name: 'scanlines', category: 'techno', weight: 2, render});
