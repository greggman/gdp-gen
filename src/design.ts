/**
 * Builds a single design as a detached <svg> at an explicit size. Shared by the
 * live page (main.ts, viewport-sized) and the debug gallery (fixed tiles), so
 * both render through the exact same pipeline.
 */
import {generatePalette} from './color/palette.js';
import {Context} from './core/context.js';
import {makeRng, Rng} from './core/rng.js';
import {pickComposition} from './core/registry.js';
import {createRoot} from './core/renderer.js';
import {TextSettings} from './core/types.js';
import './generators/index.js'; // registers all generators (used by compositions)
import './compositions/index.js'; // registers all compositions
import {pickFont} from './typography/fonts.js';
import {SCRIPTS} from './typography/scripts.js';

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

/** Builds and returns a finished design SVG for `seed` at `width` x `height`. */
export function buildDesign(seed: string, width: number, height: number): SVGSVGElement {
  const rng = makeRng(seed);
  const root = createRoot(width, height);
  const ctx = new Context({
    rng,
    width,
    height,
    palette: generatePalette(rng),
    text: chooseText(rng),
    root,
  });
  const composition = pickComposition(rng);
  root.setAttribute('data-composition', composition.name);
  composition.render(ctx);
  return root;
}
