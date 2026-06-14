/**
 * Art Deco fan/shell motif: rows of overlapping fan-shaped shells, each fan a
 * set of nested concentric arcs radiating from a base point, in the scalloped
 * "rising sun" style of 1920s deco ornament. Fans tile the region edge to edge.
 */
import {registerGenerator} from '../core/registry.js';
import {DesignContext, Rect} from '../core/types.js';
import {baseFill, clipped, palettePair, svgEl} from './_generator.js';

/** Builds an SVG path for a wedge sector arc between two angles at radius r. */
function ring(cx: number, cy: number, rIn: number, rOut: number, a0: number, a1: number): string {
  const x0o = cx + rOut * Math.cos(a0);
  const y0o = cy + rOut * Math.sin(a0);
  const x1o = cx + rOut * Math.cos(a1);
  const y1o = cy + rOut * Math.sin(a1);
  const x1i = cx + rIn * Math.cos(a1);
  const y1i = cy + rIn * Math.sin(a1);
  const x0i = cx + rIn * Math.cos(a0);
  const y0i = cy + rIn * Math.sin(a0);
  return (
    `M${x0o.toFixed(1)} ${y0o.toFixed(1)}` +
    `A${rOut.toFixed(1)} ${rOut.toFixed(1)} 0 0 1 ${x1o.toFixed(1)} ${y1o.toFixed(1)}` +
    `L${x1i.toFixed(1)} ${y1i.toFixed(1)}` +
    `A${rIn.toFixed(1)} ${rIn.toFixed(1)} 0 0 0 ${x0i.toFixed(1)} ${y0i.toFixed(1)}Z`
  );
}

function render(ctx: DesignContext, bounds: Rect): SVGElement {
  const {rng, palette} = ctx;
  const {bg, fg} = palettePair(ctx, rng);
  const mid = palette.accent === fg ? palette.primary : palette.accent;
  const g = clipped(ctx, bounds);
  baseFill(g, bounds, bg);

  const cols = rng.int(2, 4);
  const fanW = bounds.w / cols;
  const fanR = fanW * 0.62;
  const rows = Math.ceil(bounds.h / fanR) + 1;
  const bands = rng.int(4, 6);

  for (let row = 0; row < rows; row++) {
    // Stagger alternate rows for a fish-scale shell layout.
    const offset = (row % 2) * (fanW / 2);
    const cy = bounds.y + row * fanR;
    for (let col = -1; col <= cols; col++) {
      const cx = bounds.x + col * fanW + offset + fanW / 2;
      let dColor = '';
      for (let b = 0; b < bands; b++) {
        const rOut = fanR * ((bands - b) / bands);
        const rIn = fanR * ((bands - b - 1) / bands);
        const d = ring(cx, cy, rIn, rOut, 0, Math.PI);
        const color = b % 2 === 0 ? fg : mid;
        if (color === fg) dColor += d;
        else g.appendChild(svgEl('path', {d, fill: mid}));
      }
      if (dColor) g.appendChild(svgEl('path', {d: dColor, fill: fg}));
    }
  }
  return g;
}

registerGenerator({name: 'art-deco-fan', category: 'geometric', weight: 2, render});
