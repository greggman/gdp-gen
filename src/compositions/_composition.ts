/**
 * Shared helpers for composition algorithms.
 *
 * A composition lays out a whole design: it partitions the viewport into
 * regions and fills them with color blocks, generator textures, and text. These
 * helpers centralize the boring parts (background, text styles, the design's
 * text bundle) so each algorithm can focus on layout.
 */
import {Rng} from '../core/rng.js';
import {Color, DesignContext, Rect} from '../core/types.js';
import {TextStyle} from '../typography/fitText.js';
import {scriptByName} from '../typography/scripts.js';
import {makeBundle, TextBundle} from '../typography/textgen.js';

/** Fills the whole canvas with a flat background color. */
export function fillBackground(ctx: DesignContext, color: Color = ctx.palette.background): void {
  ctx.root.appendChild(
    ctx.el('rect', {x: 0, y: 0, width: ctx.width, height: ctx.height, fill: color}),
  );
}

/** A solid color block. */
export function block(ctx: DesignContext, r: Rect, fill: Color, parent?: SVGElement): SVGRectElement {
  const el = ctx.el('rect', {x: r.x, y: r.y, width: r.w, height: r.h, fill});
  (parent ?? ctx.root).appendChild(el);
  return el;
}

/** True if the design's script is right-to-left. */
export function isRtl(ctx: DesignContext): boolean {
  return !!scriptByName(ctx.text.script).rtl;
}

/** Builds a text style from the design's font at a given size/weight. */
export function textStyle(ctx: DesignContext, size: number, weight = 400): TextStyle {
  const script = scriptByName(ctx.text.script);
  return {family: ctx.text.font.family, weight, size, rtl: script.rtl, lang: script.lang};
}

/** Picks a heavy weight available in the design's font (for display text). */
export function heavyWeight(ctx: DesignContext): number {
  const w = ctx.text.font.weights;
  return w[w.length - 1];
}

/** The design's generated text, or null if this design has no text. */
export function textBundle(ctx: DesignContext): TextBundle | null {
  if (!ctx.text.enabled) return null;
  return makeBundle(ctx.rng, ctx.text.script, ctx.text.withEnglish);
}

/** A margin proportional to the smaller viewport dimension. */
export function margin(ctx: DesignContext, frac = 0.06): number {
  return Math.min(ctx.width, ctx.height) * frac;
}

/** Reference size for "large" type, scaled to the viewport. */
export function displaySize(ctx: DesignContext, frac: number): number {
  return Math.min(ctx.width, ctx.height) * frac;
}

/** Picks one of the palette's accent/primary colors for a region fill. */
export function regionFill(ctx: DesignContext, rng: Rng): Color {
  return rng.weighted(
    [ctx.palette.primary, ctx.palette.accent, ctx.palette.colors[3] ?? ctx.palette.primary],
    [4, 2, 2],
  );
}
