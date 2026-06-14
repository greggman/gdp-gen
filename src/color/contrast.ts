/**
 * WCAG contrast utilities. All ratios use sRGB relative luminance so they are
 * comparable regardless of how a color was authored (hex, rgb, hsl, oklch).
 */
import {Color} from '../core/types.js';
import {oklchToRgb, parseColor, Rgb, rgbToOklch} from './colorSpaces.js';

/** WCAG contrast thresholds. */
export const AA_NORMAL = 4.5;
export const AA_LARGE = 3.0;

const BLACK: Rgb = {r: 0, g: 0, b: 0};
const WHITE: Rgb = {r: 255, g: 255, b: 255};

function channelLuminance(c: number): number {
  const cn = c / 255;
  return cn <= 0.03928 ? cn / 12.92 : ((cn + 0.055) / 1.055) ** 2.4;
}

/** WCAG relative luminance in [0, 1]. */
export function relativeLuminance(rgb: Rgb): number {
  return (
    0.2126 * channelLuminance(rgb.r) +
    0.7152 * channelLuminance(rgb.g) +
    0.0722 * channelLuminance(rgb.b)
  );
}

function toRgb(color: Color | Rgb): Rgb {
  if (typeof color !== 'string') return color;
  return parseColor(color) ?? BLACK;
}

/** Contrast ratio between two colors, from 1 (none) to 21 (black/white). */
export function contrastRatio(a: Color | Rgb, b: Color | Rgb): number {
  const la = relativeLuminance(toRgb(a));
  const lb = relativeLuminance(toRgb(b));
  const hi = Math.max(la, lb);
  const lo = Math.min(la, lb);
  return (hi + 0.05) / (lo + 0.05);
}

/** True if `bg` reads as dark. */
export function isDark(color: Color | Rgb): boolean {
  return relativeLuminance(toRgb(color)) < 0.4;
}

/** True if foreground/background meet the given minimum ratio. */
export function meetsContrast(fg: Color | Rgb, bg: Color | Rgb, min = AA_NORMAL): boolean {
  return contrastRatio(fg, bg) >= min;
}

/**
 * Returns whichever of the candidates has the highest contrast against `bg`.
 * Falls back to black/white if no candidate clears `min`.
 */
export function pickReadableColor(bg: Color, candidates: Color[], min = AA_NORMAL): Color {
  let best: Color = candidates[0] ?? '#000';
  let bestRatio = 0;
  for (const c of candidates) {
    const r = contrastRatio(c, bg);
    if (r > bestRatio) {
      best = c;
      bestRatio = r;
    }
  }
  if (bestRatio >= min) return best;
  return blackOrWhiteOn(bg);
}

/** Returns black or white, whichever contrasts more with `bg`. */
export function blackOrWhiteOn(bg: Color): Color {
  return contrastRatio(WHITE, bg) >= contrastRatio(BLACK, bg) ? '#fff' : '#111';
}

/**
 * Returns `fg` if it already meets `min` against `bg`; otherwise nudges `fg`'s
 * lightness (in OKLCH, away from the background) until it does, preserving hue
 * and chroma where possible. Falls back to black/white as a last resort.
 */
export function ensureContrast(fg: Color, bg: Color, min = AA_NORMAL): Color {
  if (meetsContrast(fg, bg, min)) return fg;

  const fgRgb = toRgb(fg);
  const bgDark = isDark(bg);
  const base = rgbToOklch(fgRgb);
  // Walk lightness toward white (on dark bg) or black (on light bg).
  const target = bgDark ? 1 : 0;
  for (let t = 0.1; t <= 1.0001; t += 0.1) {
    const l = base.l + (target - base.l) * t;
    const candidate = oklchToRgb({l, c: base.c * (1 - t * 0.5), h: base.h});
    if (contrastRatio(candidate, bg) >= min) {
      return `rgb(${candidate.r} ${candidate.g} ${candidate.b})`;
    }
  }
  return blackOrWhiteOn(bg);
}
