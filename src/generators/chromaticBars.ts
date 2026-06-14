/**
 * Chromatic bars: chunky bars drawn three times in red, green and blue, each
 * channel nudged by a different offset and combined additively (screen-ish via
 * opacity) so the bars fringe into cyan/magenta/yellow at their edges -- the
 * classic RGB-split / chromatic-aberration glitch look.
 */
import {registerGenerator} from '../core/registry.js';
import {DesignContext, Rect} from '../core/types.js';
import {baseFill, clipped, palettePair, svgEl} from './_generator.js';

interface Bar {
  pos: number;
  thick: number;
}

function render(ctx: DesignContext, bounds: Rect): SVGElement {
  const {rng} = ctx;
  // Background only; the bars carry the color via RGB primaries.
  const {bg} = palettePair(ctx, rng);
  const g = clipped(ctx, bounds);
  baseFill(g, bounds, bg);

  const vertical = rng.chance(0.5);
  const span = vertical ? bounds.w : bounds.h;
  const cross = vertical ? bounds.h : bounds.w;

  // Lay out a set of bars across the span.
  const bars: Bar[] = [];
  let cursor = 0;
  while (cursor < span) {
    const gap = span * rng.range(0.03, 0.09);
    const thick = span * rng.range(0.04, 0.12);
    cursor += gap;
    if (cursor + thick > span) break;
    bars.push({pos: cursor, thick});
    cursor += thick;
    if (bars.length > 40) break;
  }

  const maxOff = span * 0.03;
  const channels: Array<[string, number]> = [
    ['#ff0000', rng.range(-maxOff, maxOff)],
    ['#00ff00', rng.range(-maxOff, maxOff)],
    ['#0000ff', rng.range(-maxOff, maxOff)],
  ];

  // Each channel: one combined path, screen-blended so overlaps brighten.
  for (const [color, off] of channels) {
    let d = '';
    for (const b of bars) {
      const p = b.pos + off;
      if (vertical) {
        d += `M${(bounds.x + p).toFixed(1)} ${bounds.y.toFixed(1)}h${b.thick.toFixed(1)}v${cross.toFixed(1)}h${(-b.thick).toFixed(1)}z`;
      } else {
        d += `M${bounds.x.toFixed(1)} ${(bounds.y + p).toFixed(1)}h${cross.toFixed(1)}v${b.thick.toFixed(1)}h${(-cross).toFixed(1)}z`;
      }
    }
    g.appendChild(svgEl('path', {d, fill: color, style: 'mix-blend-mode:screen'}));
  }
  return g;
}

registerGenerator({name: 'chromatic-bars', category: 'gradient', weight: 2, render});
