/**
 * Letter collage: a handful of huge glyphs from the design's script, overlapping
 * at varied scales, rotations and opacities -- the layered, cut-and-paste
 * typography of punk flyers and Dada collage. Each letter is big enough to bleed
 * past the region; the clip group crops them into a busy, depth-filled field.
 */
import {registerGenerator} from '../core/registry.js';
import {DesignContext, Rect} from '../core/types.js';
import {makeWord} from '../typography/textgen.js';
import {scriptByName} from '../typography/scripts.js';
import {baseFill, clipped, palettePair, svgEl} from './_generator.js';

function render(ctx: DesignContext, bounds: Rect): SVGElement {
  const {rng, palette} = ctx;
  const {bg, fg} = palettePair(ctx, rng);
  const g = clipped(ctx, bounds);
  baseFill(g, bounds, bg);

  const script = scriptByName(ctx.text.script);
  const family = ctx.text.font.family;
  const palettePool = [fg, palette.accent, palette.primary, palette.colors[1] ?? fg];
  const glyphs = Array.from(makeWord(rng, script) + makeWord(rng, script));
  const pool = glyphs.length ? glyphs : ['A', 'B', 'C'];

  const base = Math.min(bounds.w, bounds.h);
  const count = rng.int(6, 14);
  for (let i = 0; i < count; i++) {
    const cx = bounds.x + rng.range(0.05, 0.95) * bounds.w;
    const cy = bounds.y + rng.range(0.05, 0.95) * bounds.h;
    const size = base * rng.range(0.35, 1.1);
    const angle = rng.chance(0.5) ? rng.range(-30, 30) : rng.pick([0, 90, -90]);
    const fill = rng.pick(palettePool);
    const t = svgEl('text', {
      x: cx.toFixed(1),
      y: (cy + size * 0.34).toFixed(1),
      'font-family': family,
      'font-size': size.toFixed(1),
      'font-weight': rng.pick([700, 900]),
      'text-anchor': 'middle',
      fill,
      'fill-opacity': rng.range(0.6, 1).toFixed(2),
      transform: `rotate(${angle.toFixed(1)} ${cx.toFixed(1)} ${cy.toFixed(1)})`,
    });
    t.textContent = rng.pick(pool);
    g.appendChild(t);
  }
  return g;
}

registerGenerator({name: 'letter-collage', category: 'type', weight: 2, render});
