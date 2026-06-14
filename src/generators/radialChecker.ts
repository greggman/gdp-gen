/**
 * Radial checker: a checkerboard mapped into polar coordinates -- alternating
 * filled cells form rings divided by angular sectors, like a dartboard weave.
 */
import {registerGenerator} from '../core/registry.js';
import {DesignContext, Rect} from '../core/types.js';
import {baseFill, clipped, palettePair, svgEl} from './_generator.js';

function render(ctx: DesignContext, bounds: Rect): SVGElement {
  const {rng} = ctx;
  const {bg, fg} = palettePair(ctx, rng);
  const g = clipped(ctx, bounds);
  baseFill(g, bounds, bg);

  const cx = bounds.x + bounds.w / 2;
  const cy = bounds.y + bounds.h / 2;
  const maxR = Math.hypot(bounds.w, bounds.h) / 2;
  const rings = rng.int(4, 9);
  const sectors = rng.int(8, 20);
  const phase = rng.range(0, Math.PI * 2);
  const ringStep = maxR / rings;
  const secStep = (Math.PI * 2) / sectors;

  // One path collects every filled cell (annular sector) -> light DOM.
  let d = '';
  for (let r = 0; r < rings; r++) {
    for (let s = 0; s < sectors; s++) {
      if ((r + s) % 2 === 0) continue;
      const r0 = r * ringStep;
      const r1 = (r + 1) * ringStep;
      const a0 = phase + s * secStep;
      const a1 = a0 + secStep;
      const x0o = (cx + Math.cos(a0) * r1).toFixed(2);
      const y0o = (cy + Math.sin(a0) * r1).toFixed(2);
      const x1o = (cx + Math.cos(a1) * r1).toFixed(2);
      const y1o = (cy + Math.sin(a1) * r1).toFixed(2);
      const x1i = (cx + Math.cos(a1) * r0).toFixed(2);
      const y1i = (cy + Math.sin(a1) * r0).toFixed(2);
      const x0i = (cx + Math.cos(a0) * r0).toFixed(2);
      const y0i = (cy + Math.sin(a0) * r0).toFixed(2);
      d += `M${x0o} ${y0o}A${r1.toFixed(2)} ${r1.toFixed(2)} 0 0 1 ${x1o} ${y1o}` +
        `L${x1i} ${y1i}A${r0.toFixed(2)} ${r0.toFixed(2)} 0 0 0 ${x0i} ${y0i}Z`;
    }
  }
  g.appendChild(svgEl('path', {d, fill: fg, 'fill-rule': 'evenodd'}));
  return g;
}

registerGenerator({name: 'radial-checker', category: 'radial', weight: 2, render});
