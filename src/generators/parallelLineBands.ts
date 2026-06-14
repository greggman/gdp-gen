/**
 * Parallel line bands: the region is split into bands; each band is filled with
 * tightly packed parallel lines whose direction and density vary band to band,
 * a rhythmic op-art striping seen on record sleeves.
 */
import {registerGenerator} from '../core/registry.js';
import {DesignContext, Rect} from '../core/types.js';
import {baseFill, clipped, palettePair, svgEl} from './_generator.js';

function render(ctx: DesignContext, bounds: Rect): SVGElement {
  const {rng} = ctx;
  const {bg, fg} = palettePair(ctx, rng);
  const g = clipped(ctx, bounds);
  baseFill(g, bounds, bg);

  const horizontal = rng.chance();
  const bands = rng.int(3, 7);
  const along = horizontal ? bounds.h : bounds.w;
  const bandSize = along / bands;
  const diag = Math.hypot(bounds.w, bounds.h);
  const cx = bounds.x + bounds.w / 2;
  const cy = bounds.y + bounds.h / 2;
  const stroke = Math.max(0.7, Math.min(bounds.w, bounds.h) * rng.range(0.003, 0.007));
  const angles = [0, 45, 90, 135];

  for (let b = 0; b < bands; b++) {
    const angle = rng.pick(angles) + rng.range(-3, 3);
    const spacing = stroke * rng.range(2.5, 6);
    const lines = Math.min(220, Math.ceil(diag / spacing));
    const band: Rect = horizontal
      ? {x: bounds.x, y: bounds.y + b * bandSize, w: bounds.w, h: bandSize}
      : {x: bounds.x + b * bandSize, y: bounds.y, w: bandSize, h: bounds.h};

    const id = `pl-${b}-${rng.int(0, 1e6)}`;
    const clip = svgEl('clipPath', {id});
    clip.appendChild(
      svgEl('rect', {x: band.x, y: band.y, width: band.w, height: band.h}),
    );
    const defs = svgEl('defs');
    defs.appendChild(clip);
    g.appendChild(defs);

    const rot = svgEl('g', {
      'clip-path': `url(#${id})`,
      transform: `rotate(${angle.toFixed(2)} ${cx} ${cy})`,
    });
    let d = '';
    for (let i = 0; i <= lines; i++) {
      const y = (cy - diag / 2 + i * spacing).toFixed(1);
      d += `M${(cx - diag / 2).toFixed(1)} ${y}H${(cx + diag / 2).toFixed(1)}`;
    }
    rot.appendChild(
      svgEl('path', {d, stroke: fg, 'stroke-width': stroke.toFixed(2), fill: 'none'}),
    );
    g.appendChild(rot);
  }
  return g;
}

registerGenerator({name: 'parallel-line-bands', category: 'lines', weight: 2, render});
