/**
 * Vertical text stripes: tall columns of running text set on their side, packed
 * across the width like a spine wall of book stacks or the rotated credits on a
 * film poster. Columns alternate reading direction and color so the verticals
 * read as bold stripes from afar and as text up close.
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
  const weight = rng.pick([500, 700, 900]);

  const cols = rng.int(4, 12);
  const cw = bounds.w / cols;
  const size = cw * rng.range(0.55, 0.85);

  for (let c = 0; c < cols; c++) {
    const cx = bounds.x + (c + 0.5) * cw;
    const up = rng.chance(0.5); // reading direction alternates per taste
    const angle = up ? -90 : 90;
    const fill = rng.chance(0.18) ? palette.accent : fg;
    const phrase = makePhrase(rng, script, {words: rng.int(4, 9), casing: 'upper'});
    // Pivot at the column center, rotate, then draw text along the (now vertical)
    // x-axis centered on the column. `dy` nudges the baseline onto the column.
    const cy = bounds.y + bounds.h / 2;
    const t = svgEl('text', {
      x: 0,
      y: 0,
      dy: (size * 0.34).toFixed(1),
      'font-family': family,
      'font-size': size.toFixed(1),
      'font-weight': weight,
      'text-anchor': 'middle',
      fill,
      'letter-spacing': (size * rng.range(0, 0.08)).toFixed(2),
      transform: `translate(${cx.toFixed(1)} ${cy.toFixed(1)}) rotate(${angle})`,
    });
    t.textContent = phrase || 'TYPE';
    g.appendChild(t);
  }
  return g;
}

registerGenerator({name: 'vertical-text-stripes', category: 'type', weight: 2, render});
