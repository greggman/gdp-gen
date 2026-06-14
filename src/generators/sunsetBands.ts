/**
 * Sunset bands: horizontal stripes of solid color whose lightness steps across
 * a vertical ramp, like a banded sky at dusk. Optionally a soft top-to-bottom
 * gradient is layered under the bands to deepen the blend.
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

  // Underlying smooth ramp for depth between the discrete bands.
  const id = uid('sky');
  const grad = svgEl('linearGradient', {id, x1: '0', y1: '0', x2: '0', y2: '1'});
  grad.appendChild(svgEl('stop', {offset: '0', 'stop-color': fg}));
  grad.appendChild(svgEl('stop', {offset: '1', 'stop-color': bg}));
  const defs = svgEl('defs');
  defs.appendChild(grad);
  g.appendChild(defs);
  g.appendChild(
    svgEl('rect', {x: bounds.x, y: bounds.y, width: bounds.w, height: bounds.h, fill: `url(#${id})`}),
  );

  const ramp: Color[] = [fg, palette.accent, palette.primary, bg];
  const count = rng.int(6, 16);
  const bandH = bounds.h / count;
  for (let i = 0; i < count; i++) {
    const col: Color = ramp[Math.min(ramp.length - 1, Math.floor((i / count) * ramp.length))];
    // Bands thin out toward the horizon for a stacked-strata effect.
    const opacity = (0.35 + (i / count) * 0.5).toFixed(2);
    g.appendChild(
      svgEl('rect', {
        x: bounds.x,
        y: bounds.y + i * bandH,
        width: bounds.w,
        height: bandH + 0.5,
        fill: col,
        'fill-opacity': opacity,
      }),
    );
  }
  return g;
}

registerGenerator({name: 'sunset-bands', category: 'gradient', weight: 2, render});
