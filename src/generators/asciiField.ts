/**
 * ASCII field: a dense, fine-grained wall of small glyphs in the design's script,
 * packed line after line like an ASCII-art dump, a terminal screen, or the body
 * copy of a brutalist zine reduced to pure texture. Each row is one <text> node
 * (and occasional accent runs) so the field can be very dense yet stay light.
 */
import {registerGenerator} from '../core/registry.js';
import {DesignContext, Rect} from '../core/types.js';
import {makePhrase} from '../typography/textgen.js';
import {scriptByName} from '../typography/scripts.js';
import {baseFill, clipped, palettePair, svgEl} from './_generator.js';

function render(ctx: DesignContext, bounds: Rect): SVGElement {
  const {rng, palette} = ctx;
  const {bg, fg} = palettePair(ctx, rng);
  const g = clipped(ctx, bounds);
  baseFill(g, bounds, bg);

  const script = scriptByName(ctx.text.script);
  const family = ctx.text.font.family;
  const weight = rng.pick([400, 500]);

  // Small type, many lines. Cap rows so the node count stays modest.
  const size = Math.min(bounds.w, bounds.h) * rng.range(0.018, 0.04);
  const lineH = size * rng.range(1.05, 1.25);
  const rows = Math.min(220, Math.ceil(bounds.h / lineH));
  const letterSpace = size * rng.range(0.05, 0.25);
  // Enough characters to overflow the width; the clip crops the right edge.
  const perLine = Math.ceil((bounds.w / (size * 0.62)) + 4);

  for (let r = 0; r < rows; r++) {
    const y = bounds.y + (r + 1) * lineH;
    let line = makePhrase(rng, script, {words: rng.int(6, 14), casing: 'sentence'});
    while (line.length < perLine) {
      line += (script.spaceWords ? ' ' : '') + makePhrase(rng, script, {words: rng.int(4, 9)});
    }
    const accent = rng.chance(0.12);
    const t = svgEl('text', {
      x: bounds.x.toFixed(1),
      y: y.toFixed(1),
      'font-family': family,
      'font-size': size.toFixed(2),
      'font-weight': weight,
      'text-anchor': 'start',
      fill: accent ? palette.accent : fg,
      'letter-spacing': letterSpace.toFixed(2),
      'fill-opacity': rng.range(0.7, 1).toFixed(2),
    });
    t.textContent = line.slice(0, perLine + 8);
    g.appendChild(t);
  }
  return g;
}

registerGenerator({name: 'ascii-field', category: 'type', weight: 2, render});
