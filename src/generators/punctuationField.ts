/**
 * Punctuation field: punctuation and symbol marks scattered across the region at
 * random positions, sizes and rotations -- the playful, sparse mark-making of a
 * jazz album sleeve or a Saul Bass title sequence. Density scales with area; a
 * mix of small and a few oversized marks gives the field scale contrast.
 */
import {registerGenerator} from '../core/registry.js';
import {DesignContext, Rect} from '../core/types.js';
import {baseFill, clipped, palettePair, svgEl} from './_generator.js';

const MARKS = ['!', '?', ';', ':', ',', '.', '"', "'", '(', ')', '&', '@', '%', '*', '/', '—', '·'];

function render(ctx: DesignContext, bounds: Rect): SVGElement {
  const {rng, palette} = ctx;
  const {bg, fg} = palettePair(ctx, rng);
  const g = clipped(ctx, bounds);
  baseFill(g, bounds, bg);

  const family = ctx.text.font.family;
  const palettePool = [fg, fg, palette.accent, palette.primary];
  const base = Math.min(bounds.w, bounds.h);
  const area = bounds.w * bounds.h;
  const count = Math.min(900, Math.round(area / rng.range(2200, 5000)));

  for (let i = 0; i < count; i++) {
    const cx = bounds.x + rng.next() * bounds.w;
    const cy = bounds.y + rng.next() * bounds.h;
    // Mostly small marks with an occasional oversized statement mark.
    const size = rng.chance(0.08)
      ? base * rng.range(0.18, 0.4)
      : base * rng.range(0.03, 0.09);
    const angle = rng.chance(0.4) ? rng.range(-45, 45) : 0;
    const t = svgEl('text', {
      x: cx.toFixed(1),
      y: cy.toFixed(1),
      'font-family': family,
      'font-size': size.toFixed(1),
      'font-weight': rng.pick([400, 700, 900]),
      'text-anchor': 'middle',
      fill: rng.pick(palettePool),
      'fill-opacity': rng.range(0.7, 1).toFixed(2),
      transform: angle ? `rotate(${angle.toFixed(1)} ${cx.toFixed(1)} ${cy.toFixed(1)})` : '',
    });
    t.textContent = rng.pick(MARKS);
    g.appendChild(t);
  }
  return g;
}

registerGenerator({name: 'punctuation-field', category: 'type', weight: 2, render});
