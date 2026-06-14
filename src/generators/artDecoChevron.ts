/**
 * Art Deco stepped chevrons: bold zig-zag bands that climb the region in
 * stepped tiers, alternating two colors, evoking 1930s deco frieze ornament.
 * Each chevron band is a single filled path spanning the full width.
 */
import {registerGenerator} from '../core/registry.js';
import {DesignContext, Rect} from '../core/types.js';
import {baseFill, clipped, palettePair, svgEl} from './_generator.js';

function render(ctx: DesignContext, bounds: Rect): SVGElement {
  const {rng, palette} = ctx;
  const {bg, fg} = palettePair(ctx, rng);
  const alt = palette.accent === fg ? palette.primary : palette.accent;
  const g = clipped(ctx, bounds);
  baseFill(g, bounds, bg);

  const teeth = rng.int(3, 6);
  const toothW = bounds.w / teeth;
  const peak = toothW * rng.range(0.45, 0.8);
  // Band thickness measured vertically; bands stack to cover full height.
  const bandH = bounds.h / rng.int(6, 11);
  const bandsNeeded = Math.ceil((bounds.h + peak) / bandH) + 1;

  for (let b = 0; b < bandsNeeded; b++) {
    const yTop = bounds.y - peak + b * bandH;
    let d = `M${bounds.x.toFixed(1)} ${(yTop + peak).toFixed(1)}`;
    // Upper edge: zig-zag across the width.
    for (let i = 0; i < teeth; i++) {
      const x0 = bounds.x + i * toothW;
      const xm = x0 + toothW / 2;
      const x1 = x0 + toothW;
      d += `L${xm.toFixed(1)} ${yTop.toFixed(1)}`;
      d += `L${x1.toFixed(1)} ${(yTop + peak).toFixed(1)}`;
    }
    // Lower edge: same zig-zag offset down by bandH, traced back.
    const yTopL = yTop + bandH;
    d += `L${(bounds.x + bounds.w).toFixed(1)} ${(yTopL + peak).toFixed(1)}`;
    for (let i = teeth - 1; i >= 0; i--) {
      const x0 = bounds.x + i * toothW;
      const xm = x0 + toothW / 2;
      d += `L${xm.toFixed(1)} ${yTopL.toFixed(1)}`;
      d += `L${x0.toFixed(1)} ${(yTopL + peak).toFixed(1)}`;
    }
    d += 'Z';
    g.appendChild(svgEl('path', {d, fill: b % 2 === 0 ? fg : alt}));
  }
  return g;
}

registerGenerator({name: 'art-deco-chevron', category: 'geometric', weight: 2, render});
