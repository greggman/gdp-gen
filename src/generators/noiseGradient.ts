/**
 * Noise gradient: a smooth linear ramp from background to foreground, then a
 * scatter of small semi-transparent dots whose density tracks the local ramp
 * value -- ordered-ish dithering that breaks up the banding and gives the fade
 * a gritty, screen-printed texture.
 */
import {registerGenerator} from '../core/registry.js';
import {DesignContext, Rect} from '../core/types.js';
import {uid} from '../core/renderer.js';
import {baseFill, clipped, palettePair, svgEl} from './_generator.js';

function render(ctx: DesignContext, bounds: Rect): SVGElement {
  const {rng} = ctx;
  const {bg, fg} = palettePair(ctx, rng);
  const g = clipped(ctx, bounds);
  baseFill(g, bounds, bg);

  // Underlying smooth ramp so the dither only has to hide subtle banding.
  const vertical = rng.chance(0.5);
  const id = uid('ng');
  const grad = svgEl('linearGradient', {
    id,
    x1: '0',
    y1: '0',
    x2: vertical ? '0' : '1',
    y2: vertical ? '1' : '0',
  });
  grad.appendChild(svgEl('stop', {offset: '0', 'stop-color': bg}));
  grad.appendChild(svgEl('stop', {offset: '1', 'stop-color': fg}));
  const defs = svgEl('defs');
  defs.appendChild(grad);
  g.appendChild(defs);
  g.appendChild(
    svgEl('rect', {x: bounds.x, y: bounds.y, width: bounds.w, height: bounds.h, fill: `url(#${id})`}),
  );

  // Dither: lay a grid of cells; in each, the chance of stamping an fg dot
  // rises with the ramp value, so the speckle thickens toward the fg end.
  const cols = 60;
  const rows = Math.max(20, Math.round(cols * (bounds.h / bounds.w)));
  const cw = bounds.w / cols;
  const ch = bounds.h / rows;
  const r = Math.min(cw, ch) * 0.42;
  let d = '';
  let count = 0;
  for (let ry = 0; ry < rows && count < 1400; ry++) {
    for (let cx2 = 0; cx2 < cols && count < 1400; cx2++) {
      const t = vertical ? ry / (rows - 1) : cx2 / (cols - 1);
      // Two opposing dither layers would be ideal; one pointing toward fg
      // suffices and keeps the node budget low.
      if (rng.next() > t) continue;
      const px = bounds.x + (cx2 + 0.5) * cw;
      const py = bounds.y + (ry + 0.5) * ch;
      d += `M${px.toFixed(1)} ${py.toFixed(1)}m${(-r).toFixed(1)} 0a${r.toFixed(1)} ${r.toFixed(1)} 0 1 0 ${(r * 2).toFixed(1)} 0a${r.toFixed(1)} ${r.toFixed(1)} 0 1 0 ${(-r * 2).toFixed(1)} 0z`;
      count++;
    }
  }
  if (d) g.appendChild(svgEl('path', {d, fill: fg, 'fill-opacity': '0.8'}));
  return g;
}

registerGenerator({name: 'noise-gradient', category: 'gradient', weight: 2, render});
