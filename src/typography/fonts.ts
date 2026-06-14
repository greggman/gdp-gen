/**
 * Default web-font stacks. No fonts are loaded -- everything resolves to fonts
 * already on the machine via generic families and widely-installed names. For
 * non-Latin scripts we lean on the generic families (`serif`, `sans-serif`),
 * which the OS maps to a script-appropriate face.
 */
import {Rng} from '../core/rng.js';
import {FontChoice} from '../core/types.js';
import {Script} from './scripts.js';

/**
 * `widthRatio` is the rough advance-width-to-font-size ratio, used only as a
 * fallback estimate; fitText measures real widths in the DOM when it can.
 */
const SANS: FontChoice[] = [
  {family: 'Helvetica, Arial, sans-serif', weights: [400, 700], widthRatio: 0.52},
  {family: '"Arial Narrow", Arial, sans-serif', weights: [400, 700], widthRatio: 0.42},
  {family: 'Verdana, Geneva, sans-serif', weights: [400, 700], widthRatio: 0.6},
  {family: '"Trebuchet MS", sans-serif', weights: [400, 700], widthRatio: 0.5},
  {family: 'system-ui, sans-serif', weights: [400, 600, 800], widthRatio: 0.52},
  {family: 'Impact, "Haettenschweiler", sans-serif', weights: [400], widthRatio: 0.45},
];

const SERIF: FontChoice[] = [
  {family: 'Georgia, "Times New Roman", serif', weights: [400, 700], widthRatio: 0.5},
  {family: '"Times New Roman", Times, serif', weights: [400, 700], widthRatio: 0.48},
  {family: '"Palatino Linotype", Palatino, serif', weights: [400, 700], widthRatio: 0.52},
  {family: 'Didot, "Bodoni MT", Georgia, serif', weights: [400, 700], widthRatio: 0.5},
];

const MONO: FontChoice[] = [
  {family: '"Courier New", Courier, monospace', weights: [400, 700], widthRatio: 0.6},
  {family: '"Lucida Console", Monaco, monospace', weights: [400], widthRatio: 0.6},
  {family: 'ui-monospace, monospace', weights: [400, 700], widthRatio: 0.6},
];

/** Generic stacks that defer to the OS's script-appropriate font. */
const GENERIC_SANS: FontChoice = {family: 'sans-serif', weights: [400, 700], widthRatio: 0.95};
const GENERIC_SERIF: FontChoice = {family: 'serif', weights: [400, 700], widthRatio: 0.95};

/**
 * Picks a font for the given script. Latin gets the full curated set; other
 * scripts get generic families (so the right face is used), with a full-width
 * estimate for CJK.
 */
export function pickFont(rng: Rng, script: Script): FontChoice {
  if (script.name === 'latin') {
    const group = rng.weighted([SANS, SERIF, MONO], [5, 3, 1]);
    return rng.pick(group);
  }
  const base = rng.chance(0.6) ? GENERIC_SANS : GENERIC_SERIF;
  return {...base, widthRatio: script.fullWidth ? 1.0 : 0.7};
}
