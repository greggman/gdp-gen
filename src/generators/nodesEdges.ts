/**
 * Nodes and edges: a scattered network of node dots connected to their nearest
 * neighbors by thin links, evoking a graph or constellation diagram.
 */
import {registerGenerator} from '../core/registry.js';
import {DesignContext, Rect} from '../core/types.js';
import {baseFill, clipped, palettePair, svgEl} from './_generator.js';

function render(ctx: DesignContext, bounds: Rect): SVGElement {
  const {rng, palette} = ctx;
  const {bg, fg} = palettePair(ctx, rng);
  const g = clipped(ctx, bounds);
  baseFill(g, bounds, bg);

  const area = bounds.w * bounds.h;
  const n = Math.min(140, Math.max(12, Math.round(area / rng.range(9000, 22000))));
  const nodes: Array<{x: number; y: number}> = [];
  for (let i = 0; i < n; i++) {
    nodes.push({
      x: bounds.x + rng.next() * bounds.w,
      y: bounds.y + rng.next() * bounds.h,
    });
  }

  // Link each node to its k nearest neighbors.
  const k = rng.int(2, 3);
  const linkR = Math.hypot(bounds.w, bounds.h) * rng.range(0.18, 0.32);
  const linkR2 = linkR * linkR;
  let edges = '';
  for (let i = 0; i < n; i++) {
    const dists: Array<{j: number; d2: number}> = [];
    for (let j = 0; j < n; j++) {
      if (j === i) continue;
      const dx = nodes[i].x - nodes[j].x;
      const dy = nodes[i].y - nodes[j].y;
      const d2 = dx * dx + dy * dy;
      if (d2 <= linkR2) dists.push({j, d2});
    }
    dists.sort((a, b) => a.d2 - b.d2);
    for (let m = 0; m < Math.min(k, dists.length); m++) {
      const j = dists[m].j;
      if (j < i) continue; // avoid duplicate edges
      edges += `M${nodes[i].x.toFixed(1)} ${nodes[i].y.toFixed(1)}L${nodes[j].x.toFixed(1)} ${nodes[j].y.toFixed(1)}`;
    }
  }
  const stroke = Math.max(0.6, Math.min(bounds.w, bounds.h) * 0.0025);
  g.appendChild(
    svgEl('path', {
      d: edges,
      fill: 'none',
      stroke: fg,
      'stroke-width': stroke.toFixed(2),
      'stroke-opacity': '0.5',
    }),
  );

  // Node dots as one path of circles.
  const nodeR = Math.max(2, Math.min(bounds.w, bounds.h) * rng.range(0.006, 0.012));
  let dots = '';
  for (const p of nodes) {
    dots += `M${(p.x - nodeR).toFixed(1)} ${p.y.toFixed(1)}a${nodeR.toFixed(1)} ${nodeR.toFixed(1)} 0 1 0 ${(nodeR * 2).toFixed(1)} 0a${nodeR.toFixed(1)} ${nodeR.toFixed(1)} 0 1 0 ${(-nodeR * 2).toFixed(1)} 0z`;
  }
  g.appendChild(svgEl('path', {d: dots, fill: palette.accent}));
  return g;
}

registerGenerator({name: 'nodes-edges', category: 'techno', weight: 2, render});
