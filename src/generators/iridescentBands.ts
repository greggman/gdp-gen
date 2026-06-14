/**
 * Iridescent bands: fine parallel stripes with a holographic sheen. A true
 * rainbow clashes with any scheme, so instead each stripe SNAPS to one of the
 * palette's own hues (primary / accent / a harmony swatch) while a fast
 * lightness ripple gives the oil-on-water shimmer -- multi-tone, but only from
 * the design's harmony.
 */
import {registerGenerator} from '../core/registry.js';
import {Hsl, hslCss, parseColor, rgbToHsl} from '../color/colorSpaces.js';
import {DesignContext, Rect} from '../core/types.js';
import {clamp} from '../layout/geometry.js';
import {baseFill, clipped, svgEl} from './_generator.js';

/** Distinct palette hues, as HSL. */
function paletteHsls(ctx: DesignContext): Hsl[] {
  const p = ctx.palette;
  const seen = new Set<string>();
  const out: Hsl[] = [];
  for (const c of [p.primary, p.accent, ...p.colors.slice(3)]) {
    if (seen.has(c)) continue;
    seen.add(c);
    const rgb = parseColor(c);
    if (rgb) out.push(rgbToHsl(rgb));
  }
  return out.length ? out : [{h: 220, s: 60, l: 50}];
}

function render(ctx: DesignContext, bounds: Rect): SVGElement {
  const {rng, palette} = ctx;
  const g = clipped(ctx, bounds);
  baseFill(g, bounds, palette.background);

  const hues = paletteHsls(ctx);
  const baseL = clamp(
    hues.reduce((s, h) => s + h.l, 0) / hues.length,
    40,
    62,
  );
  const lAmp = rng.range(16, 30);

  const cx = bounds.x + bounds.w / 2;
  const cy = bounds.y + bounds.h / 2;
  const diag = Math.hypot(bounds.w, bounds.h);
  const angle = rng.pick([0, 30, 45, 90, 135, rng.int(0, 180)]);
  const count = rng.int(40, 90);
  const step = diag / count;
  // Slowly cycle which palette hue is active; ripple lightness quickly.
  const huePeriod = rng.range(4, 9); // stripes per hue
  const lightCycles = rng.range(4, 8);

  const rot = svgEl('g', {transform: `rotate(${angle} ${cx} ${cy})`});
  for (let i = 0; i <= count; i++) {
    const t = i / count;
    const base = hues[Math.floor(i / huePeriod) % hues.length];
    const l = clamp(baseL + Math.sin(t * Math.PI * lightCycles) * lAmp, 12, 94);
    const x = cx - diag / 2 + i * step;
    rot.appendChild(
      svgEl('rect', {
        x: x.toFixed(1),
        y: (cy - diag / 2).toFixed(1),
        width: (step + 0.6).toFixed(2),
        height: diag.toFixed(1),
        fill: hslCss({h: base.h, s: Math.max(50, base.s), l}),
      }),
    );
  }
  g.appendChild(rot);
  return g;
}

registerGenerator({name: 'iridescent-bands', category: 'gradient', weight: 2, render});
