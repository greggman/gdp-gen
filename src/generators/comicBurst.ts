/**
 * Comic action speed-burst: a fan of sharp triangular rays exploding outward
 * from an off-center focal point, the spikes alternating thickness and reaching
 * past the edges so the whole region fills with a dynamic "POW!" radial blast.
 * A few concentric impact rings near the focus add to the comic-book energy.
 */
import {registerGenerator} from '../core/registry.js';
import {DesignContext, Rect} from '../core/types.js';
import {baseFill, clipped, palettePair, svgEl} from './_generator.js';

function render(ctx: DesignContext, bounds: Rect): SVGElement {
  const {rng} = ctx;
  const {bg, fg} = palettePair(ctx, rng);
  const g = clipped(ctx, bounds);
  baseFill(g, bounds, bg);

  // Focal point, biased somewhat off-center for drama.
  const fx = bounds.x + bounds.w * rng.range(0.3, 0.7);
  const fy = bounds.y + bounds.h * rng.range(0.3, 0.7);
  const reach = Math.hypot(bounds.w, bounds.h) * 1.2;

  const spikes = rng.int(14, 26);
  const startA = rng.range(0, Math.PI * 2);
  let d = '';
  // Each spike is a thin triangle from the focus out to the far edge; gaps
  // between them let the background show through as the contrasting rays.
  for (let i = 0; i < spikes; i++) {
    const a0 = startA + (i / spikes) * Math.PI * 2;
    const wedge = (Math.PI * 2) / spikes;
    const half = wedge * rng.range(0.28, 0.44);
    const x1 = fx + Math.cos(a0 - half) * reach;
    const y1 = fy + Math.sin(a0 - half) * reach;
    const x2 = fx + Math.cos(a0 + half) * reach;
    const y2 = fy + Math.sin(a0 + half) * reach;
    d += `M${fx.toFixed(1)} ${fy.toFixed(1)}L${x1.toFixed(1)} ${y1.toFixed(1)}L${x2.toFixed(1)} ${y2.toFixed(1)}Z`;
  }
  g.appendChild(svgEl('path', {d, fill: fg}));

  // Impact ring(s) around the focus, drawn in the background color to punch out.
  const rings = rng.int(1, 3);
  const minDim = Math.min(bounds.w, bounds.h);
  for (let i = 0; i < rings; i++) {
    const rr = minDim * rng.range(0.04, 0.14) * (i + 1);
    g.appendChild(
      svgEl('circle', {
        cx: fx,
        cy: fy,
        r: rr,
        fill: 'none',
        stroke: bg,
        'stroke-width': (minDim * 0.012).toFixed(1),
      }),
    );
  }
  g.appendChild(svgEl('circle', {cx: fx, cy: fy, r: minDim * 0.03, fill: bg}));
  return g;
}

registerGenerator({name: 'comic-burst', category: 'comic', weight: 2, render});
