/**
 * Entry point: wires the refresh button and renders a design on load.
 *
 * Phase 1 draws a placeholder using the core engine to prove the pipeline
 * end to end. Color (Phase 2), typography (Phase 3), compositions (Phase 4),
 * and generators (Phase 5) replace the placeholders that follow.
 */
import {Context} from './core/context.js';
import {makeRng, Rng} from './core/rng.js';
import {createRoot, mount} from './core/renderer.js';
import {Palette, TextSettings} from './core/types.js';

const WIDTH = 1000;
const HEIGHT = 1414; // ISO A-series ratio.

function newSeed(): string {
  // Avoid Math.random reproducibility concerns: derive from time + counter.
  return (Date.now() >>> 0).toString(36) + Math.floor(performance.now()).toString(36);
}

/** Placeholder palette until Phase 2 lands. */
function placeholderPalette(rng: Rng): Palette {
  const hue = rng.int(0, 359);
  const background = `hsl(${hue} 70% 92%)`;
  const primary = `hsl(${hue} 65% 35%)`;
  const accent = `hsl(${(hue + 150) % 360} 80% 50%)`;
  return {
    scheme: 'placeholder',
    colors: [background, primary, accent],
    background,
    primary,
    accent,
    text: `hsl(${hue} 70% 12%)`,
    backgroundIsDark: false,
  };
}

/** Placeholder text settings until Phase 3 lands. */
function placeholderText(): TextSettings {
  return {
    enabled: true,
    script: 'latin',
    withEnglish: false,
    font: {family: 'system-ui, sans-serif', weights: [400, 700], widthRatio: 0.5},
  };
}

function generate(seed = newSeed()): void {
  location.hash = seed;
  const rng = makeRng(seed);
  const root = createRoot(WIDTH, HEIGHT);
  const ctx = new Context({
    rng,
    width: WIDTH,
    height: HEIGHT,
    palette: placeholderPalette(rng),
    text: placeholderText(),
    root,
  });

  // Placeholder design: background + a few accent bars + a title block.
  root.appendChild(ctx.el('rect', {width: WIDTH, height: HEIGHT, fill: ctx.palette.background}));
  for (let i = 0; i < 3; i++) {
    root.appendChild(
      ctx.el('rect', {
        x: ctx.rng.range(60, 400),
        y: 200 + i * 260,
        width: ctx.rng.range(200, 700),
        height: ctx.rng.range(20, 120),
        fill: i === 1 ? ctx.palette.accent : ctx.palette.primary,
      }),
    );
  }
  const title = ctx.el('text', {
    x: 80,
    y: HEIGHT - 140,
    'font-family': ctx.text.font.family,
    'font-size': 120,
    'font-weight': 700,
    fill: ctx.palette.text,
  });
  title.textContent = 'POSTER';
  root.appendChild(title);

  const stage = document.getElementById('stage');
  if (stage) mount(stage, root);
}

function init(): void {
  const button = document.getElementById('refresh');
  button?.addEventListener('click', () => generate());
  const seed = location.hash.slice(1);
  generate(seed || undefined);
}

init();
