/**
 * Arc scatter: concentric multi-band rainbows scattered and rotated across the
 * field. Each cluster is a stack of half-ring strokes in palette colors, a
 * cheerful Memphis/postmodern motif.
 */
import {registerGenerator} from '../core/registry.js';
import {Color, DesignContext, Rect} from '../core/types.js';
import {baseFill, clipped, palettePair, svgEl} from './_generator.js';

function render(ctx: DesignContext, bounds: Rect): SVGElement {
  const {rng, palette} = ctx;
  const {bg} = palettePair(ctx, rng);
  const g = clipped(ctx, bounds);
  baseFill(g, bounds, bg);

  const inks: Color[] = [
    palette.primary,
    palette.accent,
    palette.colors[2] ?? palette.primary,
    palette.colors[4] ?? palette.accent,
  ];
  const unit = Math.min(bounds.w, bounds.h);
  const area = bounds.w * bounds.h;
  const clusters = Math.min(40, Math.max(3, Math.round(area / (unit * unit * 0.25))));

  for (let c = 0; c < clusters; c++) {
    const cx = bounds.x + rng.next() * bounds.w;
    const cy = bounds.y + rng.next() * bounds.h;
    const angle = rng.int(0, 360);
    const bands = rng.int(3, 6);
    const outer = unit * rng.range(0.12, 0.28);
    const band = outer / (bands + 1);
    const node = svgEl('g', {transform: `translate(${cx.toFixed(1)} ${cy.toFixed(1)}) rotate(${angle})`});
    const order = rng.shuffle(inks);
    for (let b = 0; b < bands; b++) {
      const r = outer - b * band;
      node.appendChild(
        svgEl('path', {
          d: `M ${(-r).toFixed(1)} 0 A ${r.toFixed(1)} ${r.toFixed(1)} 0 0 1 ${r.toFixed(1)} 0`,
          fill: 'none',
          stroke: order[b % order.length],
          'stroke-width': (band * 0.7).toFixed(1),
          'stroke-linecap': 'butt',
        }),
      );
    }
    g.appendChild(node);
  }
  return g;
}

registerGenerator({name: 'arc-scatter', category: 'memphis', weight: 2, render});
