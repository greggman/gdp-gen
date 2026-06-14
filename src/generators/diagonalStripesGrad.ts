/**
 * Diagonal stripes with a fade: bold diagonal bars over a background, but each
 * bar's opacity ramps along its length so the stripes dissolve from solid into
 * the field on one side -- stripes meeting a gradient.
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

  // A fade mask: stripes are fully opaque on one side, vanish on the other.
  const flip = rng.chance(0.5);
  const maskId = uid('dsg-mask');
  const gradId = uid('dsg-g');
  const grad = svgEl('linearGradient', {
    id: gradId,
    x1: '0',
    y1: '0',
    x2: '1',
    y2: rng.chance(0.5) ? '1' : '0',
  });
  grad.appendChild(svgEl('stop', {offset: '0', 'stop-color': flip ? 'black' : 'white'}));
  grad.appendChild(svgEl('stop', {offset: '1', 'stop-color': flip ? 'white' : 'black'}));
  const mask = svgEl('mask', {id: maskId});
  mask.appendChild(
    svgEl('rect', {x: bounds.x, y: bounds.y, width: bounds.w, height: bounds.h, fill: `url(#${gradId})`}),
  );
  const defs = svgEl('defs');
  defs.appendChild(grad);
  defs.appendChild(mask);
  g.appendChild(defs);

  const masked = svgEl('g', {mask: `url(#${maskId})`});
  const cx = bounds.x + bounds.w / 2;
  const cy = bounds.y + bounds.h / 2;
  const diag = Math.hypot(bounds.w, bounds.h);
  const angle = rng.pick([45, 135]);
  const count = rng.int(8, 22);
  const stepLen = diag / count;
  const stripeW = stepLen * rng.range(0.35, 0.6);

  const rot = svgEl('g', {transform: `rotate(${angle} ${cx} ${cy})`});
  for (let i = 0; i <= count; i++) {
    const x = cx - diag / 2 + i * stepLen;
    rot.appendChild(
      svgEl('rect', {
        x: x.toFixed(1),
        y: (cy - diag / 2).toFixed(1),
        width: stripeW.toFixed(2),
        height: diag.toFixed(1),
        fill: fg,
      }),
    );
  }
  masked.appendChild(rot);
  g.appendChild(masked);
  return g;
}

registerGenerator({name: 'diagonal-stripes-grad', category: 'gradient', weight: 2, render});
