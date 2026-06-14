/**
 * Palette generation following common color-harmony rules.
 *
 * A base hue is rotated into a harmony set (mono/analogous/complementary/etc.),
 * a light or dark background is chosen, then semantic roles are assigned and
 * validated for contrast so text stays readable and large shapes stay legible.
 */
import {Rng} from '../core/rng.js';
import {Color, Palette} from '../core/types.js';
import {Hsl, hslCss} from './colorSpaces.js';
import {AA_LARGE, AA_NORMAL, ensureContrast, isDark} from './contrast.js';

/**
 * Hue-relationship strategy. We mostly avoid "pick the opposite hue" -- saturated
 * complementary pairs (purple+green, etc.) vibrate and look amateur. The default
 * is the accent staying on/near the hero's hue. But ~14% of the time we DO go
 * bold-contrast for the occasional striking poster: the saving rule is that the
 * loud opposite hues are forced to a strong VALUE (brightness) difference, which
 * is what stops complementary pairs from vibrating.
 */
type Strategy = 'monochrome' | 'analogous' | 'muted-contrast' | 'bold-contrast';
const STRATEGIES: Strategy[] = ['monochrome', 'analogous', 'muted-contrast', 'bold-contrast'];
const STRATEGY_WEIGHTS = [4, 6, 1, 1.8];

const wrapHue = (h: number) => ((h % 360) + 360) % 360;
const clampN = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v);

/**
 * Generates a professional, contrast-checked palette.
 *
 * Rather than "pick the opposite hue" (which produces the classic clashing,
 * vibrating combos like saturated purple + saturated green), this follows
 * real-world rules:
 *  - 60-30-10: a dominant, usually NEUTRAL background, one saturated hero color,
 *    and a sparing accent.
 *  - No color vibration: two saturated contrasting hues at similar brightness
 *    clash, so a distant accent hue is desaturated AND kept at a clearly
 *    different lightness from the hero.
 *  - A strong value (lightness) hierarchy across background / hero / accent.
 */
export function generatePalette(rng: Rng): Palette {
  const strategy = rng.weighted(STRATEGIES, STRATEGY_WEIGHTS);
  const baseHue = rng.int(0, 359);
  const darkBackground = rng.chance(0.45);

  // 60% -- a dominant, near-neutral background at an extreme lightness. Only a
  // faint tint of the base hue; it must not compete with the hero color.
  const bgSat = rng.chance(0.8) ? rng.range(3, 12) : rng.range(13, 24);
  const bgL = darkBackground ? rng.range(6, 15) : rng.range(89, 97);
  const background = hslCss({h: baseHue, s: bgSat, l: bgL});

  // 30% -- the hero: one saturated color on the base hue with strong value
  // contrast against the background.
  const heroSat = rng.range(58, 90);
  const primaryL = darkBackground ? rng.range(52, 66) : rng.range(30, 44);
  const primary = ensureContrast(
    hslCss({h: baseHue, s: heroSat, l: primaryL}),
    background,
    AA_LARGE,
  );

  // 10% -- the accent: the most distant harmony hue, TAMED. Far hues are
  // desaturated (so they don't vibrate against the saturated hero) and the
  // accent always sits at a clearly different lightness than the hero.
  const sign = rng.chance(0.5) ? 1 : -1;
  const accentOffset =
    strategy === 'monochrome'
      ? 0
      : strategy === 'analogous'
        ? rng.range(16, 46) * sign
        : strategy === 'muted-contrast'
          ? rng.pick([150, 165, 195, 210]) // far but heavily muted
          : rng.pick([120, 150, 180, 210, 240]); // bold-contrast: complementary/split/triadic
  const accentHue = wrapHue(baseHue + accentOffset);
  const accentSat =
    strategy === 'muted-contrast'
      ? heroSat * rng.range(0.22, 0.4)
      : strategy === 'monochrome'
        ? heroSat * rng.range(0.55, 0.8)
        : strategy === 'bold-contrast'
          ? heroSat * rng.range(0.82, 1.0) // keep the opposite hue LOUD
          : heroSat * rng.range(0.6, 0.9);
  // Bold-contrast forces a wider value gap between hero and accent -- the loud
  // opposite hues only work because their brightness clearly differs.
  const lgap = strategy === 'bold-contrast' ? rng.range(22, 36) : rng.range(10, 22);
  const accentL = darkBackground
    ? clampN(primaryL + lgap, 48, 90)
    : clampN(primaryL - lgap, 10, 38);
  const accent = ensureContrast(
    hslCss({h: accentHue, s: accentSat, l: accentL}),
    background,
    AA_LARGE,
  );

  // Text: a faintly hue-tinted near-black / near-white, guaranteed readable.
  const textL = darkBackground ? rng.range(90, 98) : rng.range(6, 15);
  const textTint: Hsl = {h: baseHue, s: rng.range(5, 16), l: textL};
  const text = ensureContrast(hslCss(textTint), background, AA_NORMAL);

  // Harmonized extra swatches for generators: tints/shades of the hero and a
  // muted accent -- kept tame so generator fills stay on-brand, never clashing.
  const swatches: Color[] = [
    hslCss({h: baseHue, s: heroSat * 0.85, l: clampN(primaryL + (darkBackground ? 14 : -12), 12, 86)}),
    hslCss({h: accentHue, s: accentSat * 0.9, l: clampN(accentL + (darkBackground ? -12 : 12), 14, 84)}),
    hslCss({h: baseHue, s: rng.range(18, 38), l: darkBackground ? rng.range(24, 38) : rng.range(64, 80)}),
  ];

  return {
    scheme: strategy,
    colors: [background, primary, accent, ...swatches],
    background,
    primary,
    accent,
    text,
    backgroundIsDark: isDark(background),
  };
}
