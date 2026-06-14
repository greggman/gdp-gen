/**
 * Angular sweep: a single diagonal linear gradient with several color stops
 * drawn from the palette, set at a random angle. Evokes a clean editorial
 * cover with light raking across the page.
 */
import {registerGenerator} from '../core/registry.js';
import {Color, DesignContext, Rect} from '../core/types.js';
import {baseFill, clipped, palettePair, svgEl} from './_generator.js';
import {uid} from '../core/renderer.js';

function render(ctx: DesignContext, bounds: Rect): SVGElement {
  const {rng, palette} = ctx;
  const {bg, fg} = palettePair(ctx, rng);
  const g = clipped(ctx, bounds);
  baseFill(g, bounds, bg);

  const angle = rng.range(0, Math.PI * 2);
  // Express the angle as endpoints in the [0,1] gradient box.
  const dx = Math.cos(angle);
  const dy = Math.sin(angle);
  const x1 = (0.5 - dx * 0.5).toFixed(3);
  const y1 = (0.5 - dy * 0.5).toFixed(3);
  const x2 = (0.5 + dx * 0.5).toFixed(3);
  const y2 = (0.5 + dy * 0.5).toFixed(3);

  const id = uid('sweep');
  const grad = svgEl('linearGradient', {id, x1, y1, x2, y2});
  const ramp: Color[] = rng.shuffle([fg, palette.accent, palette.primary, bg]);
  const stops = rng.int(3, ramp.length);
  let t = 0;
  for (let i = 0; i < stops; i++) {
    // Uneven stop positions for an off-balance, designed sweep.
    t = i === stops - 1 ? 1 : t + rng.range(0.5, 1.5) / stops;
    grad.appendChild(
      svgEl('stop', {
        offset: Math.min(1, t).toFixed(3),
        'stop-color': ramp[i % ramp.length],
      }),
    );
  }
  const defs = svgEl('defs');
  defs.appendChild(grad);
  g.appendChild(defs);
  g.appendChild(
    svgEl('rect', {
      x: bounds.x,
      y: bounds.y,
      width: bounds.w,
      height: bounds.h,
      fill: `url(#${id})`,
    }),
  );
  return g;
}

registerGenerator({name: 'angular-sweep', category: 'gradient', weight: 2, render});
