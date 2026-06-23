/**
 * Builds a single design as a detached <svg> at an explicit size. Shared by the
 * live page (main.ts, viewport-sized) and the debug gallery (fixed tiles), so
 * both render through the exact same pipeline.
 */
import {generatePalette} from './color/palette.js';
import {Context} from './core/context.js';
import {makeRng, Rng} from './core/rng.js';
import {getComposition, pickComposition} from './core/registry.js';
import {createRoot} from './core/renderer.js';
import {TextOverrides, TextSettings} from './core/types.js';
import './generators/index.js'; // registers all generators (used by compositions)
import './compositions/index.js'; // registers all compositions
import {pickFont} from './typography/fonts.js';
import {scriptByName, SCRIPTS} from './typography/scripts.js';

/** Chooses script, English pairing, and font for a design. */
function chooseText(rng: Rng): TextSettings {
  const script = rng.weighted(
    SCRIPTS,
    SCRIPTS.map(s => s.weight ?? 1),
  );
  return {
    enabled: rng.chance(0.9),
    script: script.name,
    withEnglish: script.name !== 'latin' && rng.chance(0.4),
    font: pickFont(rng, script),
  };
}

/** Options for forcing parts of the pipeline (used by the debug gallery). */
export interface BuildOptions {
  /** Force a specific composition by name (else chosen from the seed). */
  composition?: string;
  /** Force text on/off (else chosen from the seed). */
  textEnabled?: boolean;
  /** Force a specific script by name (else chosen from the seed). */
  script?: string;
  /** Explicit text to use in place of the generated made-up text. */
  text?: TextOverrides;
}

/**
 * Reads text/script overrides from URL query params, so the live page and the
 * gallery can both preview a design with specific copy. Recognized params (with
 * aliases): title|headline, subtitle|byline|sub, body|description|desc (split on
 * newlines or `|` into lines), label|edition, english|en, and script. Returns
 * only the fields that were present.
 */
export function parseTextParams(params: URLSearchParams): Pick<BuildOptions, 'text' | 'script'> {
  const get = (...keys: string[]): string | undefined => {
    for (const k of keys) {
      const v = params.get(k);
      if (v !== null) return v;
    }
    return undefined;
  };
  const text: TextOverrides = {};
  const headline = get('title', 'headline');
  if (headline !== undefined) text.headline = headline;
  const sub = get('subtitle', 'byline', 'sub');
  if (sub !== undefined) text.sub = sub;
  const label = get('label', 'edition');
  if (label !== undefined) text.label = label;
  const english = get('english', 'en');
  if (english !== undefined) text.english = english;
  const body = get('body', 'description', 'desc');
  if (body !== undefined) text.body = body.split(/\r?\n|\|/).map(s => s.trim()).filter(Boolean);

  const script = get('script');
  return {
    text: Object.keys(text).length ? text : undefined,
    script: script ?? undefined,
  };
}

/** Builds and returns a finished design SVG for `seed` at `width` x `height`. */
export function buildDesign(
  seed: string,
  width: number,
  height: number,
  opts: BuildOptions = {},
): SVGSVGElement {
  const rng = makeRng(seed);
  const root = createRoot(width, height);
  const text = chooseText(rng);
  if (opts.textEnabled !== undefined) text.enabled = opts.textEnabled;
  if (opts.script) {
    // Re-pick the font for the forced script from a SEPARATE rng so the main
    // sequence (palette, layout) stays identical to the un-forced design.
    text.script = opts.script;
    text.font = pickFont(makeRng(`${seed}~font`), scriptByName(opts.script));
  }
  if (opts.text) {
    text.enabled = true; // explicit copy implies the design should show text
    text.overrides = opts.text;
  }
  const ctx = new Context({
    rng,
    width,
    height,
    palette: generatePalette(rng),
    text,
    root,
  });
  const composition =
    (opts.composition && getComposition(opts.composition)) || pickComposition(rng);
  root.setAttribute('data-composition', composition.name);
  composition.render(ctx);
  return root;
}
