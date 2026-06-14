/**
 * Repeated word: a single made-up word tiled across justified rows, the way a
 * Warhol-ish or fashion-editorial poster turns one word into an all-over print.
 * Alternate rows shift horizontally (brick offset) and the row stack can tilt to
 * a shallow angle so the field reads as deliberate texture, not a table.
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
  const weight = rng.pick([700, 800, 900]);
  const word = makePhrase(rng, script, {words: 1, casing: 'upper'}) || 'TYPE';

  const angle = rng.pick([0, 0, -8, 8, -4]);
  const cx = bounds.x + bounds.w / 2;
  const cy = bounds.y + bounds.h / 2;
  const diag = Math.hypot(bounds.w, bounds.h);

  const rows = rng.int(5, 16);
  const size = (diag / rows) * rng.range(0.55, 0.8);
  const lineH = diag / rows;
  const sep = rng.pick(['  ', ' ', ' · ', '/']);
  const line = (word + sep).repeat(40);

  const rot = svgEl('g', {transform: `rotate(${angle} ${cx} ${cy})`});
  for (let r = 0; r <= rows; r++) {
    const y = cy - diag / 2 + r * lineH + size;
    const shift = (r % 2) * size * rng.range(0.3, 1.2);
    const fill = rng.chance(0.15) ? palette.accent : fg;
    const t = svgEl('text', {
      x: (cx - diag / 2 - shift).toFixed(1),
      y: y.toFixed(1),
      'font-family': family,
      'font-size': size.toFixed(1),
      'font-weight': weight,
      'text-anchor': 'start',
      fill,
      'letter-spacing': (size * rng.range(-0.02, 0.06)).toFixed(2),
    });
    t.textContent = line;
    rot.appendChild(t);
  }
  g.appendChild(rot);
  return g;
}

registerGenerator({name: 'repeated-word', category: 'type', weight: 2, render});
