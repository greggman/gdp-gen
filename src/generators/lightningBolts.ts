/**
 * Branching lightning: a jagged main bolt forks from the top edge to the bottom
 * via midpoint-displacement, spawning recursive side branches that taper and
 * fade. A faint wide glow stroke sits under a bright thin core for a charged,
 * electric look.
 */
import {registerGenerator} from '../core/registry.js';
import {DesignContext, Point, Rect} from '../core/types.js';
import {baseFill, clipped, palettePair, svgEl} from './_generator.js';

function render(ctx: DesignContext, bounds: Rect): SVGElement {
  const {rng} = ctx;
  const {bg, fg} = palettePair(ctx, rng);
  const g = clipped(ctx, bounds);
  baseFill(g, bounds, bg);

  type Seg = {a: Point; b: Point; depth: number};
  const segments: Seg[] = [];

  // Recursive midpoint-displaced bolt; randomly forks a fading branch.
  function bolt(a: Point, b: Point, displace: number, depth: number): void {
    if (displace < 3 || depth > 7) {
      segments.push({a, b, depth});
      return;
    }
    const midX = (a.x + b.x) / 2;
    const midY = (a.y + b.y) / 2;
    // Perpendicular offset.
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.hypot(dx, dy) || 1;
    const off = rng.range(-displace, displace);
    const mid: Point = {x: midX + (-dy / len) * off, y: midY + (dx / len) * off};
    bolt(a, mid, displace / 2, depth);
    bolt(mid, b, displace / 2, depth);
    if (depth < 4 && rng.chance(0.45)) {
      const ang = Math.atan2(dy, dx) + rng.range(-0.9, 0.9);
      const blen = len * rng.range(0.5, 0.9);
      const end: Point = {x: mid.x + Math.cos(ang) * blen, y: mid.y + Math.sin(ang) * blen};
      bolt(mid, end, displace / 1.6, depth + 2);
    }
  }

  const startX = bounds.x + rng.range(0.3, 0.7) * bounds.w;
  const endX = bounds.x + rng.range(0.2, 0.8) * bounds.w;
  bolt({x: startX, y: bounds.y}, {x: endX, y: bounds.y + bounds.h}, bounds.w * 0.32, 0);

  const buildPath = (maxDepth: number): string => {
    let d = '';
    for (const s of segments) {
      if (s.depth > maxDepth) continue;
      d += `M${s.a.x.toFixed(1)} ${s.a.y.toFixed(1)}L${s.b.x.toFixed(1)} ${s.b.y.toFixed(1)}`;
    }
    return d;
  };

  const all = buildPath(99);
  // Glow underlay then crisp core.
  g.appendChild(svgEl('path', {d: all, fill: 'none', stroke: fg, 'stroke-width': 7, 'stroke-opacity': 0.25, 'stroke-linecap': 'round'}));
  g.appendChild(svgEl('path', {d: all, fill: 'none', stroke: fg, 'stroke-width': 3.4, 'stroke-opacity': 0.55, 'stroke-linecap': 'round'}));
  g.appendChild(svgEl('path', {d: buildPath(3), fill: 'none', stroke: fg, 'stroke-width': 1.6, 'stroke-linecap': 'round'}));
  return g;
}

registerGenerator({name: 'lightning-bolts', category: 'organic', weight: 2, render});
