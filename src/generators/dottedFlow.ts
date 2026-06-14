/**
 * Dotted flow field: particles are seeded across the canvas and advected through a
 * smooth sinusoidal vector field, dropping a dot at each step so trails of dots
 * trace the field's streamlines. All dots are batched into one path; a second
 * accent path overlays a sparse set of streamlines.
 */
import {registerGenerator} from '../core/registry.js';
import {Color, DesignContext, Rect} from '../core/types.js';
import {baseFill, clipped, palettePair, svgEl} from './_generator.js';

function render(ctx: DesignContext, bounds: Rect): SVGElement {
  const {rng, palette} = ctx;
  const {bg, fg} = palettePair(ctx, rng);
  const g = clipped(ctx, bounds);
  baseFill(g, bounds, bg);

  const minDim = Math.min(bounds.w, bounds.h);
  // Field parameters: a couple of sine terms make a swirly continuous field.
  const fa = rng.range(1.5, 4) / bounds.w;
  const fb = rng.range(1.5, 4) / bounds.h;
  const phase = rng.range(0, Math.PI * 2);
  const swirl = rng.range(0.3, 1.2);
  const angleAt = (x: number, y: number) =>
    swirl * Math.PI * (Math.sin((x - bounds.x) * fa + phase) + Math.cos((y - bounds.y) * fb));

  const step = minDim * rng.range(0.012, 0.025);
  const dotR = Math.max(0.8, minDim * 0.004);
  const stepsPerLine = rng.int(14, 30);

  const area = bounds.w * bounds.h;
  const seeds = Math.max(20, Math.min(120, Math.round(area / 7000)));

  const dotPath = (px: number, py: number) =>
    `M${(px - dotR).toFixed(1)} ${py.toFixed(1)}a${dotR.toFixed(1)} ${dotR.toFixed(1)} 0 1 0 ${(dotR * 2).toFixed(1)} 0a${dotR.toFixed(1)} ${dotR.toFixed(1)} 0 1 0 ${(-dotR * 2).toFixed(1)} 0`;

  let d = '';
  for (let s = 0; s < seeds; s++) {
    let x = bounds.x + rng.next() * bounds.w;
    let y = bounds.y + rng.next() * bounds.h;
    for (let k = 0; k < stepsPerLine; k++) {
      d += dotPath(x, y);
      const ang = angleAt(x, y);
      x += Math.cos(ang) * step;
      y += Math.sin(ang) * step;
      if (x < bounds.x || x > bounds.x + bounds.w || y < bounds.y || y > bounds.y + bounds.h) break;
    }
  }
  g.appendChild(svgEl('path', {d, fill: fg}));

  // Sparse accent streamlines threaded through the same field.
  const accent: Color = palette.accent;
  const lines = rng.int(6, 16);
  let ld = '';
  for (let s = 0; s < lines; s++) {
    let x = bounds.x + rng.next() * bounds.w;
    let y = bounds.y + rng.next() * bounds.h;
    ld += `M${x.toFixed(1)} ${y.toFixed(1)}`;
    for (let k = 0; k < stepsPerLine * 2; k++) {
      const ang = angleAt(x, y);
      x += Math.cos(ang) * step;
      y += Math.sin(ang) * step;
      if (x < bounds.x || x > bounds.x + bounds.w || y < bounds.y || y > bounds.y + bounds.h) break;
      ld += `L${x.toFixed(1)} ${y.toFixed(1)}`;
    }
  }
  g.appendChild(
    svgEl('path', {
      d: ld,
      stroke: accent,
      'stroke-width': Math.max(1, minDim * 0.005).toFixed(1),
      'stroke-opacity': '0.8',
      'stroke-linecap': 'round',
      fill: 'none',
    }),
  );
  return g;
}

registerGenerator({name: 'dotted-flow', category: 'scatter', weight: 2, render});
