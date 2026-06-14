/**
 * Memphis shapes: an 80s Memphis-Milano scatter of bold primitives -- dots,
 * triangles, squiggle strokes, and tiny bars -- strewn across a flat field.
 * Loud, playful, and rule-light, in the spirit of Ettore Sottsass posters.
 */
import {registerGenerator} from '../core/registry.js';
import {Color, DesignContext, Rect} from '../core/types.js';
import {baseFill, clipped, palettePair, svgEl} from './_generator.js';

function render(ctx: DesignContext, bounds: Rect): SVGElement {
  const {rng, palette} = ctx;
  const {bg} = palettePair(ctx, rng);
  const g = clipped(ctx, bounds);
  baseFill(g, bounds, bg);

  const inks: Color[] = [palette.primary, palette.accent, palette.colors[2] ?? palette.primary];
  const area = bounds.w * bounds.h;
  const unit = Math.min(bounds.w, bounds.h);
  const count = Math.min(220, Math.max(12, Math.round(area / (unit * unit * 0.05))));

  for (let i = 0; i < count; i++) {
    const cx = bounds.x + rng.next() * bounds.w;
    const cy = bounds.y + rng.next() * bounds.h;
    const s = unit * rng.range(0.04, 0.12);
    const fill = rng.pick(inks);
    const stroke = rng.pick(inks);
    const angle = rng.int(0, 360);
    const node = svgEl('g', {transform: `translate(${cx.toFixed(1)} ${cy.toFixed(1)}) rotate(${angle})`});
    const kind = rng.weighted(
      ['dot', 'triangle', 'squiggle', 'bar', 'cross', 'arc'] as const,
      [3, 2, 2, 2, 1, 1],
    );
    switch (kind) {
      case 'dot':
        node.appendChild(svgEl('circle', {cx: 0, cy: 0, r: s, fill}));
        break;
      case 'triangle':
        node.appendChild(
          svgEl('polygon', {points: `0 ${-s} ${s} ${s} ${-s} ${s}`, fill}),
        );
        break;
      case 'squiggle':
        node.appendChild(
          svgEl('path', {
            d: `M ${-s * 1.6} 0 q ${s * 0.8} ${-s} ${s * 1.6} 0 t ${s * 1.6} 0`,
            fill: 'none',
            stroke,
            'stroke-width': s * 0.45,
            'stroke-linecap': 'round',
          }),
        );
        break;
      case 'bar':
        node.appendChild(
          svgEl('rect', {x: -s, y: -s * 0.32, width: s * 2, height: s * 0.64, fill}),
        );
        break;
      case 'cross':
        node.appendChild(
          svgEl('path', {
            d: `M ${-s} 0 H ${s} M 0 ${-s} V ${s}`,
            stroke: fill,
            'stroke-width': s * 0.4,
            'stroke-linecap': 'round',
          }),
        );
        break;
      case 'arc':
        node.appendChild(
          svgEl('path', {
            d: `M ${-s} 0 A ${s} ${s} 0 0 1 ${s} 0`,
            fill: 'none',
            stroke,
            'stroke-width': s * 0.4,
            'stroke-linecap': 'round',
          }),
        );
        break;
    }
    g.appendChild(node);
  }
  return g;
}

registerGenerator({name: 'memphis-shapes', category: 'memphis', weight: 2, render});
