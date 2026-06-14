/**
 * Flag bars: bold blocks of solid color stacked as wide bands, occasionally
 * split into offset sub-blocks. Confident, poster-like color blocking in the
 * postmodern tradition.
 */
import {registerGenerator} from '../core/registry.js';
import {Color, DesignContext, Rect} from '../core/types.js';
import {baseFill, clipped, palettePair, svgEl} from './_generator.js';

function render(ctx: DesignContext, bounds: Rect): SVGElement {
  const {rng, palette} = ctx;
  const {bg} = palettePair(ctx, rng);
  const g = clipped(ctx, bounds);
  baseFill(g, bounds, bg);

  const inks: Color[] = rng.shuffle([
    palette.primary,
    palette.accent,
    palette.colors[1] ?? palette.primary,
    palette.colors[2] ?? palette.accent,
    palette.colors[4] ?? palette.primary,
  ]);
  const vertical = rng.chance(0.45);
  const bars = rng.int(3, 8);
  const span = vertical ? bounds.w : bounds.h;
  const cross = vertical ? bounds.h : bounds.w;

  // Random unequal weights for each bar.
  const weights: number[] = [];
  let total = 0;
  for (let i = 0; i < bars; i++) {
    const w = rng.range(0.6, 1.8);
    weights.push(w);
    total += w;
  }

  let pos = 0;
  for (let i = 0; i < bars; i++) {
    const size = (weights[i] / total) * span;
    const a = (vertical ? bounds.x : bounds.y) + pos;
    const fill = inks[i % inks.length];
    if (vertical) {
      g.appendChild(svgEl('rect', {x: a, y: bounds.y, width: size, height: bounds.h, fill}));
    } else {
      g.appendChild(svgEl('rect', {x: bounds.x, y: a, width: bounds.w, height: size, fill}));
    }
    // Occasionally inset a contrasting sub-block at one end of the bar.
    if (rng.chance(0.4)) {
      const subFill = inks[(i + 1 + rng.int(0, 1)) % inks.length];
      const subLen = cross * rng.range(0.15, 0.4);
      const atStart = rng.chance();
      if (vertical) {
        g.appendChild(
          svgEl('rect', {
            x: a,
            y: atStart ? bounds.y : bounds.y + bounds.h - subLen,
            width: size,
            height: subLen,
            fill: subFill,
          }),
        );
      } else {
        g.appendChild(
          svgEl('rect', {
            x: atStart ? bounds.x : bounds.x + bounds.w - subLen,
            y: a,
            width: subLen,
            height: size,
            fill: subFill,
          }),
        );
      }
    }
    pos += size;
  }
  return g;
}

registerGenerator({name: 'flag-bars', category: 'memphis', weight: 2, render});
