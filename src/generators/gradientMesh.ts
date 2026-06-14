/**
 * Gradient mesh: several large, soft radial "blobs" in different palette colors
 * scattered across the region and blended with screen-like opacity, producing a
 * smooth multi-color mesh gradient reminiscent of modern app backgrounds.
 */
import {registerGenerator} from '../core/registry.js';
import {Color, DesignContext, Rect} from '../core/types.js';
import {baseFill, clipped, palettePair, svgEl} from './_generator.js';
import {uid} from '../core/renderer.js';

function render(ctx: DesignContext, bounds: Rect): SVGElement {
  const {rng, palette} = ctx;
  const {bg, fg} = palettePair(ctx, rng);
  const g = clipped(ctx, bounds);
  baseFill(g, bounds, bg);

  const defs = svgEl('defs');
  g.appendChild(defs);

  const colors: Color[] = [fg, palette.accent, palette.primary, palette.colors[2] ?? fg];
  const blobs = rng.int(4, 8);
  const diag = Math.hypot(bounds.w, bounds.h);

  for (let i = 0; i < blobs; i++) {
    const id = uid('blob');
    const col = colors[i % colors.length];
    const grad = svgEl('radialGradient', {id, cx: '0.5', cy: '0.5', r: '0.5'});
    grad.appendChild(
      svgEl('stop', {offset: '0', 'stop-color': col, 'stop-opacity': rng.range(0.6, 0.9).toFixed(2)}),
    );
    grad.appendChild(svgEl('stop', {offset: '0.6', 'stop-color': col, 'stop-opacity': '0.25'}));
    grad.appendChild(svgEl('stop', {offset: '1', 'stop-color': col, 'stop-opacity': '0'}));
    defs.appendChild(grad);

    const cx = bounds.x + rng.range(-0.1, 1.1) * bounds.w;
    const cy = bounds.y + rng.range(-0.1, 1.1) * bounds.h;
    const r = diag * rng.range(0.35, 0.7);
    g.appendChild(
      svgEl('circle', {
        cx: cx.toFixed(1),
        cy: cy.toFixed(1),
        r: r.toFixed(1),
        fill: `url(#${id})`,
      }),
    );
  }
  return g;
}

registerGenerator({name: 'gradient-mesh', category: 'gradient', weight: 2, render});
