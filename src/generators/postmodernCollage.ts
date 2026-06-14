/**
 * Postmodern collage: a few large, angled, overlapping shapes -- slabs, wedges,
 * discs, and grids -- layered with semi-transparency for a cut-paper collage
 * look reminiscent of 80s/90s art-school posters.
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
    palette.colors[3] ?? palette.accent,
    palette.colors[4] ?? palette.primary,
  ]);
  const unit = Math.min(bounds.w, bounds.h);
  const pieces = rng.int(5, 9);
  const cyB = bounds.y + bounds.h / 2;

  for (let i = 0; i < pieces; i++) {
    const cx = bounds.x + rng.range(0.1, 0.9) * bounds.w;
    const cy = bounds.y + rng.range(0.1, 0.9) * bounds.h;
    const angle = rng.int(0, 360);
    const fill = inks[i % inks.length];
    const opacity = rng.range(0.7, 1).toFixed(2);
    const node = svgEl('g', {
      transform: `translate(${cx.toFixed(1)} ${cy.toFixed(1)}) rotate(${angle})`,
      'fill-opacity': opacity,
    });
    const kind = rng.weighted(['slab', 'wedge', 'disc', 'grid', 'circleOutline'] as const, [3, 2, 2, 1, 1]);
    switch (kind) {
      case 'slab': {
        const w = unit * rng.range(0.4, 1.1);
        const h = unit * rng.range(0.12, 0.35);
        node.appendChild(svgEl('rect', {x: -w / 2, y: -h / 2, width: w, height: h, fill}));
        break;
      }
      case 'wedge': {
        const r = unit * rng.range(0.35, 0.8);
        node.appendChild(svgEl('polygon', {points: `0 0 ${r} ${-r * 0.4} ${r} ${r * 0.4}`, fill}));
        break;
      }
      case 'disc': {
        const r = unit * rng.range(0.18, 0.45);
        node.appendChild(svgEl('circle', {cx: 0, cy: 0, r, fill}));
        break;
      }
      case 'grid': {
        const w = unit * rng.range(0.4, 0.8);
        const lines = rng.int(4, 9);
        const gap = w / lines;
        let d = '';
        for (let k = 0; k <= lines; k++) {
          const o = -w / 2 + k * gap;
          d += `M ${(-w / 2).toFixed(1)} ${o.toFixed(1)} H ${(w / 2).toFixed(1)} `;
          d += `M ${o.toFixed(1)} ${(-w / 2).toFixed(1)} V ${(w / 2).toFixed(1)} `;
        }
        node.appendChild(
          svgEl('path', {d, fill: 'none', stroke: fill, 'stroke-width': (gap * 0.18).toFixed(1)}),
        );
        break;
      }
      case 'circleOutline': {
        const r = unit * rng.range(0.2, 0.5);
        node.appendChild(
          svgEl('circle', {cx: 0, cy: 0, r, fill: 'none', stroke: fill, 'stroke-width': (r * 0.12).toFixed(1)}),
        );
        break;
      }
    }
    g.appendChild(node);
  }
  // A confident diagonal line for that postmodern accent.
  g.appendChild(
    svgEl('line', {
      x1: bounds.x,
      y1: cyB + rng.gaussian(0, bounds.h * 0.2),
      x2: bounds.x + bounds.w,
      y2: cyB + rng.gaussian(0, bounds.h * 0.2),
      stroke: inks[0],
      'stroke-width': unit * 0.02,
    }),
  );
  return g;
}

registerGenerator({name: 'postmodern-collage', category: 'memphis', weight: 2, render});
