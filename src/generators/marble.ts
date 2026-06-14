/**
 * Marbled paper: many thin veins swept into combed swirls. A field of warped
 * polylines drifts across the region, each displaced by a few sine waves so the
 * lines bunch and fan like ink dragged through size, giving the classic
 * suminagashi / marbled-endpaper look.
 */
import {registerGenerator} from '../core/registry.js';
import {DesignContext, Rect} from '../core/types.js';
import {baseFill, clipped, palettePair, svgEl} from './_generator.js';

function render(ctx: DesignContext, bounds: Rect): SVGElement {
  const {rng, palette} = ctx;
  const {bg, fg} = palettePair(ctx, rng);
  const vein = palette.accent === fg ? palette.primary : palette.accent;
  const g = clipped(ctx, bounds);
  baseFill(g, bounds, bg);

  // A handful of swirl centers that displace each horizontal vein.
  const swirls = rng.int(2, 4);
  const sx: number[] = [];
  const sy: number[] = [];
  const sa: number[] = [];
  const sf: number[] = [];
  for (let i = 0; i < swirls; i++) {
    sx.push(bounds.x + rng.range(0.1, 0.9) * bounds.w);
    sy.push(bounds.y + rng.range(0.1, 0.9) * bounds.h);
    sa.push(rng.range(0.12, 0.3) * Math.min(bounds.w, bounds.h));
    sf.push(rng.range(0.002, 0.006));
  }

  const lines = rng.int(28, 46);
  const cols = 70;
  const step = bounds.w / cols;
  let dMain = '';
  let dVein = '';
  for (let i = 0; i <= lines; i++) {
    const baseY = bounds.y + (i / lines) * bounds.h;
    let path = '';
    for (let c = 0; c <= cols; c++) {
      const x = bounds.x + c * step;
      let y = baseY;
      for (let s = 0; s < swirls; s++) {
        const dx = x - sx[s];
        const dy = baseY - sy[s];
        const dist = Math.hypot(dx, dy) + 1;
        const pull = sa[s] * Math.exp(-dist * 0.004);
        y += Math.sin(dist * sf[s] * 6) * pull * 0.35;
        y += (sy[s] - baseY) * Math.exp(-dist * 0.006) * 0.25;
      }
      path += (c === 0 ? 'M' : 'L') + x.toFixed(1) + ' ' + y.toFixed(1);
    }
    if (i % 4 === 0) dVein += path;
    else dMain += path;
  }
  g.appendChild(svgEl('path', {d: dMain, fill: 'none', stroke: fg, 'stroke-width': 1.4, 'stroke-opacity': 0.85}));
  g.appendChild(svgEl('path', {d: dVein, fill: 'none', stroke: vein, 'stroke-width': 2.6}));
  return g;
}

registerGenerator({name: 'marble', category: 'organic', weight: 2, render});
