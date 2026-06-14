/**
 * Blueprint grid: a fine technical grid with heavier major gridlines and small
 * tick marks at intersections, like engineering graph paper.
 */
import {registerGenerator} from '../core/registry.js';
import {DesignContext, Rect} from '../core/types.js';
import {baseFill, clipped, palettePair, svgEl} from './_generator.js';

function render(ctx: DesignContext, bounds: Rect): SVGElement {
  const {rng} = ctx;
  const {bg, fg} = palettePair(ctx, rng);
  const g = clipped(ctx, bounds);
  baseFill(g, bounds, bg);

  const minor = Math.max(10, Math.min(bounds.w, bounds.h) / rng.int(18, 36));
  const major = minor * rng.pick([4, 5, 8]);
  const thin = Math.max(0.5, minor * 0.03);
  const thick = thin * rng.range(2.4, 3.6);

  // Minor lines as one faint path.
  let dMinor = '';
  for (let x = bounds.x; x <= bounds.x + bounds.w; x += minor) {
    dMinor += `M${x.toFixed(1)} ${bounds.y}V${(bounds.y + bounds.h).toFixed(1)}`;
  }
  for (let y = bounds.y; y <= bounds.y + bounds.h; y += minor) {
    dMinor += `M${bounds.x} ${y.toFixed(1)}H${(bounds.x + bounds.w).toFixed(1)}`;
  }
  g.appendChild(
    svgEl('path', {
      d: dMinor,
      fill: 'none',
      stroke: fg,
      'stroke-width': thin.toFixed(2),
      'stroke-opacity': '0.3',
    }),
  );

  // Major lines, bolder.
  let dMajor = '';
  for (let x = bounds.x; x <= bounds.x + bounds.w; x += major) {
    dMajor += `M${x.toFixed(1)} ${bounds.y}V${(bounds.y + bounds.h).toFixed(1)}`;
  }
  for (let y = bounds.y; y <= bounds.y + bounds.h; y += major) {
    dMajor += `M${bounds.x} ${y.toFixed(1)}H${(bounds.x + bounds.w).toFixed(1)}`;
  }
  g.appendChild(
    svgEl('path', {
      d: dMajor,
      fill: 'none',
      stroke: fg,
      'stroke-width': thick.toFixed(2),
      'stroke-opacity': '0.65',
    }),
  );

  // Plus-shaped ticks at minor intersections.
  const tick = minor * rng.range(0.16, 0.24);
  let dTick = '';
  for (let x = bounds.x; x <= bounds.x + bounds.w; x += minor) {
    for (let y = bounds.y; y <= bounds.y + bounds.h; y += minor) {
      dTick += `M${(x - tick).toFixed(1)} ${y.toFixed(1)}h${(tick * 2).toFixed(1)}`;
      dTick += `M${x.toFixed(1)} ${(y - tick).toFixed(1)}v${(tick * 2).toFixed(1)}`;
    }
  }
  g.appendChild(
    svgEl('path', {
      d: dTick,
      fill: 'none',
      stroke: fg,
      'stroke-width': thin.toFixed(2),
      'stroke-opacity': '0.55',
    }),
  );
  return g;
}

registerGenerator({name: 'blueprint-grid', category: 'techno', weight: 2, render});
