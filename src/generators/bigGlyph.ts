/**
 * Big glyph: one enormous character from the design's script, scaled to fill the
 * region and bled past its edges -- the single-letter cover of a type-foundry
 * specimen or a minimalist exhibition poster. A faint offset "shadow" copy and an
 * optional accent overlay add depth without breaking the bold simplicity.
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
  const glyphs = Array.from(makeWord(rng, script));
  const glyph = glyphs.length ? rng.pick(glyphs) : 'A';

  // Big enough to bleed; the clip group crops it tight.
  const size = Math.max(bounds.w, bounds.h) * rng.range(1.1, 1.6);
  const cx = bounds.x + bounds.w / 2 + rng.range(-0.12, 0.12) * bounds.w;
  const cy = bounds.y + bounds.h / 2 + rng.range(-0.08, 0.08) * bounds.h;
  const weight = rng.pick([800, 900]);

  const make = (dx: number, dy: number, fill: string, op: number) => {
    const t = svgEl('text', {
      x: (cx + dx).toFixed(1),
      y: (cy + size * 0.36 + dy).toFixed(1),
      'font-family': family,
      'font-size': size.toFixed(1),
      'font-weight': weight,
      'text-anchor': 'middle',
      fill,
      'fill-opacity': op.toFixed(2),
    });
    t.textContent = glyph;
    return t;
  };

  if (rng.chance(0.7)) {
    const off = size * rng.range(0.02, 0.06);
    g.appendChild(make(off, off, palette.accent, rng.range(0.5, 0.9)));
  }
  g.appendChild(make(0, 0, fg, 1));
  return g;
}

registerGenerator({name: 'big-glyph', category: 'type', weight: 2, render});
