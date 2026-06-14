/**
 * Zigzag rows: horizontal bands of sawtooth peaks. Each band is a single filled
 * path tracing a triangular wave across the width, with bands alternating
 * palette colors so the zigzags interlock into a continuous mountain pattern.
 */
import {registerGenerator} from '../core/registry.js';
import {Color, DesignContext, Rect} from '../core/types.js';
import {baseFill, clipped, palettePair, svgEl} from './_generator.js';

function render(ctx: DesignContext, bounds: Rect): SVGElement {
  const {rng, palette} = ctx;
  const {bg, fg} = palettePair(ctx, rng);
  const g = clipped(ctx, bounds);
  baseFill(g, bounds, bg);

  const tones: Color[] = [fg, palette.primary, palette.accent];
  const teeth = rng.int(4, 12);
  const toothW = bounds.w / teeth;
  const bandH = bounds.h / rng.int(4, 10);
  const amp = bandH * rng.range(0.35, 0.6); // zigzag amplitude
  const rows = Math.ceil(bounds.h / bandH) + 2;

  for (let row = -1; row < rows; row++) {
    const yTop = bounds.y + row * bandH;
    const fill = tones[((row % tones.length) + tones.length) % tones.length];
    // Build a closed band whose top and bottom edges are matching zigzags.
    let d = `M ${bounds.x} ${(yTop + amp).toFixed(2)}`;
    for (let i = 0; i <= teeth + 1; i++) {
      const x = bounds.x + i * toothW;
      const y = i % 2 === 0 ? yTop + amp : yTop - amp;
      d += ` L ${x.toFixed(2)} ${y.toFixed(2)}`;
    }
    // Down the right edge, back along a parallel lower zigzag.
    for (let i = teeth + 1; i >= 0; i--) {
      const x = bounds.x + i * toothW;
      const y = (i % 2 === 0 ? yTop + amp : yTop - amp) + bandH;
      d += ` L ${x.toFixed(2)} ${y.toFixed(2)}`;
    }
    d += ' Z';
    g.appendChild(svgEl('path', {d, fill}));
  }
  return g;
}

registerGenerator({name: 'zigzag-tiles', category: 'tiling', weight: 2, render});
