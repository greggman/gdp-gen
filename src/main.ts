/**
 * Entry point: wires the refresh button and renders a viewport-sized design on
 * load. The actual design pipeline lives in design.ts.
 */
import {buildDesign} from './design.js';
import {mount} from './core/renderer.js';

function newSeed(): string {
  return (Date.now() >>> 0).toString(36) + Math.floor(performance.now()).toString(36);
}

/**
 * Renders a design. The hash is `#<seed>`, or `#<seed>~<composition>` to force a
 * specific composition (used by the debug gallery's "open full page" links).
 */
function generate(hash = newSeed()): void {
  location.hash = hash;
  const [seed, composition] = hash.split('~');
  const svg = buildDesign(seed, window.innerWidth, window.innerHeight, {composition});
  const stage = document.getElementById('stage');
  if (stage) mount(stage, svg);
}

function init(): void {
  const button = document.getElementById('refresh');
  // Refresh always makes a fresh random design (no forced composition).
  button?.addEventListener('click', () => generate());
  const hash = location.hash.slice(1);
  generate(hash || undefined);
}

init();
