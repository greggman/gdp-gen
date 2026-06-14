/**
 * Paint drips from the top: a band of color along the top edge from which rounded
 * runs of paint descend to varying lengths, each ending in a swollen droplet,
 * like wet paint sagging down a poster. Drips are drawn as filled capsule paths.
 */
import {registerGenerator} from '../core/registry.js';
import {Color, DesignContext, Rect} from '../core/types.js';
import {baseFill, clipped, palettePair, svgEl} from './_generator.js';

function render(ctx: DesignContext, bounds: Rect): SVGElement {
  const {rng, palette} = ctx;
  const {bg, fg} = palettePair(ctx, rng);
  const g = clipped(ctx, bounds);
  baseFill(g, bounds, bg);

  const dripColors: Color[] = [fg, palette.accent, palette.primary];
  const paint = rng.pick(dripColors);

  // Top band the drips hang from.
  const bandH = bounds.h * rng.range(0.08, 0.2);
  g.appendChild(
    svgEl('rect', {
      x: bounds.x,
      y: bounds.y,
      width: bounds.w,
      height: bandH.toFixed(1),
      fill: paint,
    }),
  );

  const count = Math.max(6, Math.min(60, Math.round(bounds.w / rng.range(18, 50))));
  const slot = bounds.w / count;
  for (let i = 0; i < count; i++) {
    if (rng.chance(0.2)) continue; // gaps between drips
    const cx = bounds.x + (i + 0.5) * slot + rng.gaussian(0, slot * 0.15);
    const w = slot * rng.range(0.2, 0.6);
    const len = bandH + (bounds.h - bandH) * rng.range(0.05, 0.85);
    const top = bounds.y + bandH * 0.4;
    const dropR = w * rng.range(0.6, 1.1);
    const bulgeY = len - dropR;
    const color = rng.chance(0.85) ? paint : rng.pick(dripColors);
    // Capsule body + bulb at the end via arcs.
    const lx = (cx - w / 2).toFixed(1);
    const rx = (cx + w / 2).toFixed(1);
    const d =
      `M${lx} ${top.toFixed(1)}` +
      `L${lx} ${bulgeY.toFixed(1)}` +
      `A${dropR.toFixed(1)} ${dropR.toFixed(1)} 0 1 0 ${rx} ${bulgeY.toFixed(1)}` +
      `L${rx} ${top.toFixed(1)}z`;
    g.appendChild(svgEl('path', {d, fill: color}));
  }
  return g;
}

registerGenerator({name: 'drips', category: 'organic', weight: 2, render});
