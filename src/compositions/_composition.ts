/**
 * Shared helpers for composition algorithms.
 *
 * A composition lays out a whole design: it partitions the viewport into
 * regions and fills them with color blocks, generator textures, and text. These
 * helpers centralize the boring parts (background, text styles, the design's
 * text bundle) so each algorithm can focus on layout.
 */
import {parseColor} from '../color/colorSpaces.js';
import {Rng} from '../core/rng.js';
import {uid} from '../core/renderer.js';
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

/** True when the canvas is taller than it is wide (e.g. a phone screen). */
export function isPortrait(ctx: DesignContext): boolean {
  return ctx.height > ctx.width * 1.05;
}

/** Aspect ratio (width / height). <1 is portrait, >1 is landscape. */
export function aspect(ctx: DesignContext): number {
  return ctx.width / ctx.height;
}

/**
 * A filter that desaturates its input and re-tints it toward `color` (with a
 * brightness bias), so a backdrop reads as a single muted, scheme-appropriate
 * wash instead of its generator's own (possibly clashing) colors.
 */
function tintFilterId(ctx: DesignContext, color: Color): string {
  const rgb = parseColor(color) ?? {r: 128, g: 128, b: 128};
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;
  const k = 0.2; // grayscale weight (0.6 * 1/3) so white -> full tint
  const o = 0.4; // brightness bias so shadows still carry the hue
  const ch = (c: number) => `${(k * c).toFixed(4)} ${(k * c).toFixed(4)} ${(k * c).toFixed(4)} 0 ${(o * c).toFixed(4)}`;
  const values = `${ch(r)} ${ch(g)} ${ch(b)} 0 0 0 1 0`;
  const id = uid('tint');
  const filter = ctx.el('filter', {id, 'color-interpolation-filters': 'sRGB'});
  filter.appendChild(ctx.el('feColorMatrix', {type: 'matrix', values}));
  const defs = ctx.el('defs');
  defs.appendChild(filter);
  ctx.root.appendChild(defs);
  return id;
}

/**
 * With probability `chance`, lays a MUTED full-canvas generator behind the
 * content -- a faint "backdrop image" that fills plain compositions without
 * fighting the foreground. It's kept at very low opacity AND colorized toward a
 * palette hue, so it never competes with the content or clashes with the scheme.
 * Call right after fillBackground(). Returns whether a backdrop was drawn.
 */
export function backdrop(ctx: DesignContext, chance = 0.45): boolean {
  if (!ctx.rng.chance(chance)) return false;
  const g = ctx.fillRegion(ctx.bounds());
  g.setAttribute('opacity', ctx.rng.range(0.08, 0.16).toFixed(3));
  const tint = ctx.rng.chance(0.6) ? ctx.palette.primary : ctx.palette.accent;
  g.setAttribute('filter', `url(#${tintFilterId(ctx, tint)})`);
  return true;
}

/**
 * Fills a focal region with a generator, biased toward a 3D "object" so a
 * composition gets an occasional rendered object slot. `objectChance` controls
 * how often the object category is used vs. any generator.
 */
export function fillFocal(
  ctx: DesignContext,
  r: Rect,
  parent?: SVGElement,
  objectChance = 0.5,
): SVGElement {
  const category = ctx.rng.chance(objectChance) ? 'object' : undefined;
  return ctx.fillRegion(r, parent, undefined, category);
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
  return makeBundle(ctx.rng, ctx.text.script, ctx.text.withEnglish, ctx.text.overrides);
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
