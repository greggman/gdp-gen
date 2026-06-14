/**
 * Shared helpers for pattern/image generators.
 *
 * A generator fills a rectangular region with a parameterized, rule-following
 * pattern. Helpers here handle the common scaffolding: a clipped group (so a
 * pattern never spills past its region), a base fill, and color pairs drawn from
 * the palette with enough internal contrast to read.
 */
import {contrastRatio} from '../color/contrast.js';
import {Rng} from '../core/rng.js';
import {svgEl, uid} from '../core/renderer.js';
import {Color, DesignContext, Rect} from '../core/types.js';

/** A group clipped to `bounds` -- shapes drawn into it can't escape the region. */
export function clipped(ctx: DesignContext, bounds: Rect): SVGGElement {
  const id = uid('clip');
  const clip = svgEl('clipPath', {id});
  clip.appendChild(
    svgEl('rect', {x: bounds.x, y: bounds.y, width: bounds.w, height: bounds.h}),
  );
  const defs = svgEl('defs');
  defs.appendChild(clip);
  const g = svgEl('g', {'clip-path': `url(#${id})`});
  g.appendChild(defs);
  return g;
}

/** Paints a solid base color over the region. */
export function baseFill(g: SVGElement, bounds: Rect, color: Color): void {
  g.appendChild(
    svgEl('rect', {x: bounds.x, y: bounds.y, width: bounds.w, height: bounds.h, fill: color}),
  );
}

/** A foreground/background color pair with enough contrast to be visible. */
export interface Pair {
  bg: Color;
  fg: Color;
}

/**
 * Picks a palette color pair for a pattern, ensuring the two differ enough to
 * read. Falls back to background/primary if a random pick is too low-contrast.
 */
export function palettePair(ctx: DesignContext, rng: Rng): Pair {
  const p = ctx.palette;
  const options: Pair[] = [
    {bg: p.background, fg: p.primary},
    {bg: p.primary, fg: p.background},
    {bg: p.primary, fg: p.accent},
    {bg: p.accent, fg: p.background},
    {bg: p.background, fg: p.accent},
    {bg: p.accent, fg: p.primary},
  ];
  // Only use pairs with real contrast so the pattern is clearly visible -- a
  // low-variety (e.g. monochrome) palette must NOT yield a near-flat texture.
  // If nothing clears the bar, fall back to the highest-contrast pair available.
  const viable = options.filter(o => contrastRatio(o.bg, o.fg) >= 2.8);
  if (viable.length) return rng.pick(viable);
  return options.reduce((best, o) =>
    contrastRatio(o.bg, o.fg) > contrastRatio(best.bg, best.fg) ? o : best,
  );
}

/** Convenience: create an SVG element via the document (namespaced). */
export {svgEl} from '../core/renderer.js';
