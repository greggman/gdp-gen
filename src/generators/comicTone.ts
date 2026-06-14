/**
 * Comic screentone: a halftone gradient where dot size grows across the field,
 * fading from solid coverage to sparse -- the manga/comic shading effect made
 * by adhesive screentone sheets.
 */
import {registerGenerator} from '../core/registry.js';
import {DesignContext, Rect} from '../core/types.js';
import {baseFill, clipped, palettePair, svgEl} from './_generator.js';

function render(ctx: DesignContext, bounds: Rect): SVGElement {
  const {rng} = ctx;
  const {bg, fg} = palettePair(ctx, rng);
  const g = clipped(ctx, bounds);
  baseFill(g, bounds, bg);

  const cols = rng.int(20, 36);
  const step = bounds.w / cols;
  const rows = Math.ceil(bounds.h / step) + 1;
  const angle = rng.pick([0, 45, 90, 135]);
  // Gradient direction: 0 horizontal, 1 vertical, 2 radial.
  const mode = rng.int(0, 2);
  const cx0 = bounds.x + bounds.w / 2;
  const cy0 = bounds.y + bounds.h / 2;
  const maxR = step * 0.62;
  const flip = rng.chance(0.5);

  let d = '';
  for (let r = 0; r < rows; r++) {
    for (let c = -1; c <= cols; c++) {
      const cx = bounds.x + (c + 0.5) * step;
      const cy = bounds.y + (r + 0.5) * step;
      let t: number;
      if (mode === 0) {
        t = (cx - bounds.x) / bounds.w;
      } else if (mode === 1) {
        t = (cy - bounds.y) / bounds.h;
      } else {
        t = Math.hypot(cx - cx0, cy - cy0) / (Math.hypot(bounds.w, bounds.h) / 2);
      }
      if (flip) t = 1 - t;
      const radius = maxR * Math.max(0, Math.min(1, t));
      if (radius < 0.4) continue;
      d += `M${(cx - radius).toFixed(1)} ${cy.toFixed(1)}` +
        `a${radius.toFixed(1)} ${radius.toFixed(1)} 0 1 0 ${(radius * 2).toFixed(1)} 0` +
        `a${radius.toFixed(1)} ${radius.toFixed(1)} 0 1 0 ${(-radius * 2).toFixed(1)} 0z`;
    }
  }
  const rotGroup = svgEl('g', {
    transform: `rotate(${angle} ${cx0.toFixed(1)} ${cy0.toFixed(1)})`,
  });
  rotGroup.appendChild(svgEl('path', {d, fill: fg}));
  g.appendChild(rotGroup);
  return g;
}

registerGenerator({name: 'comic-tone', category: 'print', weight: 2, render});
