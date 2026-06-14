/**
 * Posterized gradient: the continuous fade from one palette color to another is
 * quantized into a handful of flat bands, each a discrete mix step. The hard
 * edges between steps give the bold, screen-print look of a posterized photo.
 */
import {registerGenerator} from '../core/registry.js';
import {Color, DesignContext, Rect} from '../core/types.js';
import {hslCss, parseColor, rgbToHsl} from '../color/colorSpaces.js';
import {baseFill, clipped, palettePair} from './_generator.js';

function lerpColor(a: Color, b: Color, t: number): Color {
  const ra = parseColor(a) ?? {r: 0, g: 0, b: 0};
  const rb = parseColor(b) ?? {r: 255, g: 255, b: 255};
  const ha = rgbToHsl(ra);
  const hb = rgbToHsl(rb);
  // Interpolate hue the short way around the wheel for clean transitions.
  let dh = hb.h - ha.h;
  if (dh > 180) dh -= 360;
  if (dh < -180) dh += 360;
  return hslCss({
    h: (ha.h + dh * t + 360) % 360,
    s: ha.s + (hb.s - ha.s) * t,
    l: ha.l + (hb.l - ha.l) * t,
  });
}

function render(ctx: DesignContext, bounds: Rect): SVGElement {
  const {rng} = ctx;
  const {bg, fg} = palettePair(ctx, rng);
  const g = clipped(ctx, bounds);
  baseFill(g, bounds, bg);

  const vertical = rng.chance(0.55);
  const steps = rng.int(4, 9);
  for (let i = 0; i < steps; i++) {
    const t = steps === 1 ? 0 : i / (steps - 1);
    const fill = lerpColor(bg, fg, t);
    const rect = vertical
      ? {
          x: bounds.x,
          y: bounds.y + (i / steps) * bounds.h,
          width: bounds.w,
          height: bounds.h / steps + 0.5,
        }
      : {
          x: bounds.x + (i / steps) * bounds.w,
          y: bounds.y,
          width: bounds.w / steps + 0.5,
          height: bounds.h,
        };
    const el = ctx.el('rect', {...rect, fill});
    g.appendChild(el);
  }
  return g;
}

registerGenerator({name: 'posterized-gradient', category: 'gradient', weight: 2, render});
