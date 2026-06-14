/**
 * Palette bands: bold parallel stripes cycling through the design's harmony
 * colors and tonal tints/shades of them. (Formerly a full-hue rainbow, which
 * clashed with every scheme -- now it stays strictly on-palette while keeping
 * the punchy multi-band look.)
 */
import {registerGenerator} from '../core/registry.js';
import {Color, DesignContext, Rect} from '../core/types.js';
import {Hsl, hslCss, parseColor, rgbToHsl} from '../color/colorSpaces.js';
import {clamp} from '../layout/geometry.js';
import {baseFill, clipped, svgEl} from './_generator.js';

/** The palette's vivid colors as HSL, de-duplicated. */
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

  const hsls = paletteHsls(ctx);
  const vertical = rng.chance(0.5);
  const count = rng.int(7, 16);
  const span = vertical ? bounds.w : bounds.h;
  const bandW = span / count;
  // Walk the palette colors in order; on each full cycle, step the lightness so
  // repeated colors read as harmonized tints/shades rather than exact repeats.
  const lightStep = rng.range(8, 16);

  for (let i = 0; i < count; i++) {
    const base = hsls[i % hsls.length];
    const cycle = Math.floor(i / hsls.length);
    const dir = cycle % 2 === 0 ? 1 : -1;
    const l = clamp(base.l + dir * Math.ceil(cycle / 2) * lightStep, 12, 90);
    const fill: Color = hslCss({h: base.h, s: base.s, l});
    const rect = vertical
      ? {x: bounds.x + i * bandW, y: bounds.y, width: bandW + 0.6, height: bounds.h}
      : {x: bounds.x, y: bounds.y + i * bandW, width: bounds.w, height: bandW + 0.6};
    g.appendChild(svgEl('rect', {...rect, fill}));
  }
  return g;
}

registerGenerator({name: 'spectrum-bands', category: 'gradient', weight: 2, render});
