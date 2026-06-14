/**
 * Ticket / coupon edges: horizontal ticket bands separated by dashed tear
 * lines and notched out with semicircular punches at the seams -- the look of
 * a strip of raffle or admission tickets.
 */
import {registerGenerator} from '../core/registry.js';
import {DesignContext, Rect} from '../core/types.js';
import {baseFill, clipped, palettePair, svgEl} from './_generator.js';

function render(ctx: DesignContext, bounds: Rect): SVGElement {
  const {rng} = ctx;
  const {bg, fg} = palettePair(ctx, rng);
  const g = clipped(ctx, bounds);
  baseFill(g, bounds, fg);

  const tickets = rng.int(3, 6);
  const th = bounds.h / tickets;
  const notch = Math.min(th, bounds.w) * rng.range(0.04, 0.07);
  const dash = th * rng.range(0.06, 0.1);
  const stroke = Math.max(1, th * 0.02);
  const innerInset = bounds.w * rng.range(0.04, 0.08);

  // Notch punches (bg color) sit on each tear seam, both edges.
  let notches = '';
  for (let i = 1; i < tickets; i++) {
    const y = bounds.y + i * th;
    notches += dot(bounds.x, y, notch) + dot(bounds.x + bounds.w, y, notch);
    // Dashed tear line between notches.
    g.appendChild(
      svgEl('line', {
        x1: (bounds.x + notch).toFixed(1),
        y1: y.toFixed(1),
        x2: (bounds.x + bounds.w - notch).toFixed(1),
        y2: y.toFixed(1),
        stroke: bg,
        'stroke-width': stroke.toFixed(2),
        'stroke-dasharray': `${dash.toFixed(1)} ${(dash * 0.8).toFixed(1)}`,
      }),
    );
  }

  // A dashed stub-divider inside each ticket for added structure.
  for (let i = 0; i < tickets; i++) {
    const y = bounds.y + i * th;
    g.appendChild(
      svgEl('line', {
        x1: (bounds.x + innerInset).toFixed(1),
        y1: (y + th * 0.18).toFixed(1),
        x2: (bounds.x + innerInset).toFixed(1),
        y2: (y + th * 0.82).toFixed(1),
        stroke: bg,
        'stroke-width': stroke.toFixed(2),
        'stroke-dasharray': `${(dash * 0.5).toFixed(1)} ${(dash * 0.5).toFixed(1)}`,
      }),
    );
  }

  g.appendChild(svgEl('path', {d: notches, fill: bg}));
  return g;
}

function dot(cx: number, cy: number, r: number): string {
  return `M${(cx - r).toFixed(1)} ${cy.toFixed(1)}` +
    `a${r.toFixed(1)} ${r.toFixed(1)} 0 1 0 ${(r * 2).toFixed(1)} 0` +
    `a${r.toFixed(1)} ${r.toFixed(1)} 0 1 0 ${(-r * 2).toFixed(1)} 0z`;
}

registerGenerator({name: 'ticket-edge', category: 'print', weight: 1, render});
