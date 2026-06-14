/**
 * Halftone lines: parallel lines whose thickness ramps across the region,
 * simulating a line-screen halftone gradient from solid to hairline.
 */
import {registerGenerator} from '../core/registry.js';
import {DesignContext, Rect} from '../core/types.js';
import {baseFill, clipped, palettePair, svgEl} from './_generator.js';

function render(ctx: DesignContext, bounds: Rect): SVGElement {
  const {rng} = ctx;
  const {bg, fg} = palettePair(ctx, rng);
  const g = clipped(ctx, bounds);
  baseFill(g, bounds, bg);

  const angle = rng.pick([0, 90, 45, 135]);
  const cx = bounds.x + bounds.w / 2;
  const cy = bounds.y + bounds.h / 2;
  const diag = Math.hypot(bounds.w, bounds.h);
  const count = rng.int(20, 60);
  const step = diag / count;
  const minW = step * 0.04;
  const maxW = step * rng.range(0.7, 0.95);
  const flip = rng.chance(0.5);

  const rot = svgEl('g', {transform: `rotate(${angle} ${cx} ${cy})`});
  for (let i = 0; i <= count; i++) {
    const t = i / count;
    const ramp = flip ? 1 - t : t;
    const w = minW + (maxW - minW) * ramp;
    const x = cx - diag / 2 + i * step + (step - w) / 2;
    rot.appendChild(
      svgEl('rect', {x: x.toFixed(1), y: cy - diag / 2, width: w.toFixed(2), height: diag, fill: fg}),
    );
  }
  g.appendChild(rot);
  return g;
}

registerGenerator({name: 'halftone-lines', category: 'dots', weight: 2, render});
