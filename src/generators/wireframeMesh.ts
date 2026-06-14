/**
 * Wireframe mesh: a perspective grid floor receding to a horizon, with rows
 * compressing toward the vanishing line, evoking retro 3D / synthwave space.
 */
import {registerGenerator} from '../core/registry.js';
import {DesignContext, Rect} from '../core/types.js';
import {baseFill, clipped, palettePair, svgEl} from './_generator.js';

function render(ctx: DesignContext, bounds: Rect): SVGElement {
  const {rng} = ctx;
  const {bg, fg} = palettePair(ctx, rng);
  const g = clipped(ctx, bounds);
  baseFill(g, bounds, bg);

  // Horizon sits in the upper portion; floor recedes below it.
  const horizonY = bounds.y + bounds.h * rng.range(0.25, 0.45);
  const vpX = bounds.x + bounds.w * rng.range(0.4, 0.6);
  const floorBottom = bounds.y + bounds.h;
  const cols = rng.int(8, 18);
  const rows = rng.int(8, 16);
  const stroke = Math.max(1, Math.min(bounds.w, bounds.h) * 0.0035);

  let d = '';

  // Vertical lines fan out from vanishing point to the bottom edge.
  for (let c = 0; c <= cols; c++) {
    const t = c / cols;
    const bx = bounds.x + t * bounds.w;
    d += `M${vpX.toFixed(1)} ${horizonY.toFixed(1)}L${bx.toFixed(1)} ${floorBottom.toFixed(1)}`;
  }

  // Horizontal rows compress toward the horizon (perspective spacing).
  const power = rng.range(2, 3.4);
  for (let r = 1; r <= rows; r++) {
    const t = r / rows;
    const y = horizonY + Math.pow(t, power) * (floorBottom - horizonY);
    d += `M${bounds.x} ${y.toFixed(1)}H${(bounds.x + bounds.w).toFixed(1)}`;
  }

  g.appendChild(
    svgEl('path', {
      d,
      fill: 'none',
      stroke: fg,
      'stroke-width': stroke.toFixed(2),
      'stroke-opacity': '0.75',
    }),
  );

  // Bright horizon line.
  g.appendChild(
    svgEl('rect', {
      x: bounds.x,
      y: (horizonY - stroke).toFixed(1),
      width: bounds.w,
      height: (stroke * 2.4).toFixed(2),
      fill: fg,
    }),
  );

  // Optional sky grid above the horizon for a fuller space feel.
  if (rng.chance(0.5)) {
    let sky = '';
    const skyRows = rng.int(3, 6);
    for (let r = 1; r <= skyRows; r++) {
      const y = horizonY - (r / skyRows) * (horizonY - bounds.y);
      sky += `M${bounds.x} ${y.toFixed(1)}H${(bounds.x + bounds.w).toFixed(1)}`;
    }
    g.appendChild(
      svgEl('path', {
        d: sky,
        fill: 'none',
        stroke: fg,
        'stroke-width': (stroke * 0.7).toFixed(2),
        'stroke-opacity': '0.25',
      }),
    );
  }
  return g;
}

registerGenerator({name: 'wireframe-mesh', category: 'techno', weight: 2, render});
