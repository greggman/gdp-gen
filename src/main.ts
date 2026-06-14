/**
 * Entry point: wires the refresh button and renders a viewport-sized design on
 * load. The actual design pipeline lives in design.ts.
 */
import {buildDesign} from './design.js';
import {mount} from './core/renderer.js';

function newSeed(): string {
  return (Date.now() >>> 0).toString(36) + Math.floor(performance.now()).toString(36);
}

function generate(seed = newSeed()): void {
  location.hash = seed;
  const svg = buildDesign(seed, window.innerWidth, window.innerHeight);
  const stage = document.getElementById('stage');
  if (stage) mount(stage, svg);
}

function init(): void {
  const button = document.getElementById('refresh');
  button?.addEventListener('click', () => generate());
  const seed = location.hash.slice(1);
  generate(seed || undefined);
}

init();
