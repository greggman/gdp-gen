/**
 * Text measurement, fitting, wrapping, and overflow handling.
 *
 * Widths are measured in the real DOM via a hidden off-screen <svg>, so fitting
 * respects the actual font the browser uses (important for non-Latin scripts).
 * Every text helper guarantees contrast against the background it sits on, and
 * "bleed" text that extends past its region can lay down a backing band so it
 * stays readable over whatever it crosses.
 */
import {Color, DesignContext, Rect} from '../core/types.js';
import {svgEl} from '../core/renderer.js';
import {AA_LARGE, AA_NORMAL, ensureContrast} from '../color/contrast.js';

export interface TextStyle {
  family: string;
  weight: number;
  size: number; // font-size in user units
  letterSpacing?: number;
  rtl?: boolean;
  /** BCP-47 tag set as xml:lang (helps Han-unified glyphs render per locale). */
  lang?: string;
}

export type Anchor = 'start' | 'middle' | 'end';

/* --------------------------- DOM measurement --------------------------- */

let measureSvg: SVGSVGElement | null = null;
let measureText: SVGTextElement | null = null;

function measurer(): SVGTextElement {
  if (!measureText) {
    measureSvg = svgEl('svg', {width: 0, height: 0});
    measureSvg.style.cssText =
      'position:absolute;left:-9999px;top:-9999px;visibility:hidden;width:0;height:0';
    measureText = svgEl('text');
    measureSvg.appendChild(measureText);
    document.body.appendChild(measureSvg);
  }
  return measureText;
}

function applyStyle(el: SVGTextElement, style: TextStyle): void {
  el.setAttribute('font-family', style.family);
  el.setAttribute('font-size', String(style.size));
  el.setAttribute('font-weight', String(style.weight));
  if (style.letterSpacing) el.setAttribute('letter-spacing', String(style.letterSpacing));
}

/** Measured advance width of `text` rendered with `style`. */
export function measureWidth(text: string, style: TextStyle): number {
  const node = measurer();
  applyStyle(node, style);
  node.textContent = text;
  return node.getComputedTextLength();
}

/* ------------------------------ Fitting ------------------------------- */

/**
 * Returns a font-size (<= style.size) at which `text` fits within `maxWidth`.
 * Width scales linearly with font-size, so one measurement suffices.
 */
export function fitSizeToWidth(
  text: string,
  maxWidth: number,
  style: TextStyle,
  min = 6,
): number {
  const w = measureWidth(text, style);
  if (w <= maxWidth || w === 0) return style.size;
  return Math.max(min, (style.size * maxWidth) / w);
}

/** Greedily wraps text into lines no wider than `maxWidth`. */
export function wrapText(text: string, maxWidth: number, style: TextStyle): string[] {
  const hasSpaces = text.includes(' ');
  const tokens = hasSpaces ? text.split(/\s+/) : Array.from(text);
  const sep = hasSpaces ? ' ' : '';
  const lines: string[] = [];
  let line = '';
  for (const tok of tokens) {
    const candidate = line ? line + sep + tok : tok;
    if (line && measureWidth(candidate, style) > maxWidth) {
      lines.push(line);
      line = tok;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/* ------------------------------ Drawing ------------------------------- */

export interface DrawOptions {
  anchor?: Anchor;
  /** Background the text sits on; the fill is contrast-corrected against it. */
  bg?: Color;
  /** Preferred fill before contrast correction (defaults to a readable pick). */
  fill?: Color;
  /** Minimum contrast ratio to enforce (default AA for normal text). */
  minContrast?: number;
  parent?: SVGElement;
}

function resolveFill(opts: DrawOptions, fallback: Color): Color {
  const preferred = opts.fill ?? fallback;
  return opts.bg ? ensureContrast(preferred, opts.bg, opts.minContrast ?? AA_NORMAL) : preferred;
}

/** Draws a single line of text at (x, baseline y). */
export function drawLine(
  ctx: DesignContext,
  x: number,
  y: number,
  text: string,
  style: TextStyle,
  opts: DrawOptions = {},
): SVGTextElement {
  const el = ctx.el('text', {
    x,
    y,
    'font-family': style.family,
    'font-size': style.size,
    'font-weight': style.weight,
    'text-anchor': opts.anchor ?? (style.rtl ? 'end' : 'start'),
    fill: resolveFill(opts, ctx.palette.text),
  });
  if (style.letterSpacing) el.setAttribute('letter-spacing', String(style.letterSpacing));
  if (style.lang) el.setAttribute('xml:lang', style.lang);
  // No explicit `direction`: strong-RTL codepoints (Hebrew/Arabic) are reordered
  // by Unicode bidi already, and `text-anchor` alone gives correct *visual*
  // alignment. Setting direction:rtl with text-anchor:end flips the anchor side
  // and pushes right-aligned text off the right edge.
  el.textContent = text;
  (opts.parent ?? ctx.root).appendChild(el);
  return el;
}

/**
 * Draws a headline inside `rect`. In 'shrink' mode the size is reduced until it
 * fits the width; in 'bleed' mode the requested size is kept and the text may
 * extend past the rect -- in which case an optional backing band keeps it
 * readable over whatever lies behind.
 */
export interface HeadlineOptions extends DrawOptions {
  mode?: 'shrink' | 'bleed';
  /** Lay a backing band (in `bg`) behind bleeding text for guaranteed contrast. */
  backing?: boolean;
  align?: Anchor;
}

export function drawHeadline(
  ctx: DesignContext,
  rect: Rect,
  text: string,
  style: TextStyle,
  opts: HeadlineOptions = {},
): SVGGElement {
  const g = ctx.group(opts.parent);
  const mode = opts.mode ?? 'shrink';
  const size = mode === 'shrink' ? fitSizeToWidth(text, rect.w, style) : style.size;
  const drawStyle: TextStyle = {...style, size};
  const align = opts.align ?? (style.rtl ? 'end' : 'start');

  const width = measureWidth(text, drawStyle);
  const x = align === 'middle' ? rect.x + rect.w / 2 : align === 'end' ? rect.x + rect.w : rect.x;
  // Baseline roughly centered in the rect (cap height ~0.7 of font size).
  const y = rect.y + rect.h / 2 + size * 0.35;

  if (mode === 'bleed' && opts.backing && opts.bg) {
    const left = align === 'middle' ? x - width / 2 : align === 'end' ? x - width : x;
    const pad = size * 0.14;
    // Cover the full glyph height (CJK glyphs rise ~0.9*size above the baseline
    // and drop ~0.22*size below it) plus even vertical padding, so text never
    // touches the band edges.
    const ascent = size * 0.9;
    const descent = size * 0.22;
    g.appendChild(
      ctx.el('rect', {
        x: left - pad,
        y: y - ascent - pad,
        width: width + pad * 2,
        height: ascent + descent + pad * 2,
        fill: opts.bg,
      }),
    );
  }

  drawLine(ctx, x, y, text, drawStyle, {
    ...opts,
    anchor: align,
    minContrast: opts.minContrast ?? AA_LARGE,
    parent: g,
  });
  return g;
}

/** Draws wrapped body text inside `rect`, top-aligned, clipped to the rect. */
export function drawParagraph(
  ctx: DesignContext,
  rect: Rect,
  text: string,
  style: TextStyle,
  opts: DrawOptions & {lineHeight?: number} = {},
): SVGGElement {
  const g = ctx.group(opts.parent);
  const lh = opts.lineHeight ?? 1.3;
  const lines = wrapText(text, rect.w, style);
  const fill = resolveFill(opts, ctx.palette.text);
  const align = opts.anchor ?? (style.rtl ? 'end' : 'start');
  const x = align === 'middle' ? rect.x + rect.w / 2 : align === 'end' ? rect.x + rect.w : rect.x;

  let y = rect.y + style.size;
  const maxY = rect.y + rect.h;
  for (const line of lines) {
    if (y > maxY) break; // Don't spill past the region for body copy.
    drawLine(ctx, x, y, line, style, {...opts, anchor: align, fill, parent: g});
    y += style.size * lh;
  }
  return g;
}
