/** Shared types for the poster generator. */
import {Rng} from './rng.js';

/** An axis-aligned rectangle in SVG user units. */
export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** A point in SVG user units. */
export interface Point {
  x: number;
  y: number;
}

/** A CSS color string (any valid CSS color: hex, hsl(), oklch(), ...). */
export type Color = string;

/**
 * A palette with semantic roles. `colors` holds the raw harmony swatches;
 * the named roles are chosen from them with contrast in mind.
 */
export interface Palette {
  scheme: string;
  colors: Color[];
  background: Color;
  primary: Color;
  accent: Color;
  text: Color;
  /** Whether the background reads as dark (drives default text choices). */
  backgroundIsDark: boolean;
}

/** A font stack plus metadata used for fitting and styling. */
export interface FontChoice {
  family: string;
  weights: number[];
  /** Rough advance-width-to-font-size ratio for measuring without DOM. */
  widthRatio: number;
}

/** Text configuration for a single design. */
export interface TextSettings {
  enabled: boolean;
  script: string;
  withEnglish: boolean;
  font: FontChoice;
}

/** A composition algorithm: lays out an entire design. */
export interface Composition {
  name: string;
  weight?: number;
  render(ctx: DesignContext): void;
}

/** A pattern/image generator: fills a rectangular region. */
export interface Generator {
  name: string;
  category: string;
  weight?: number;
  /** Returns an SVG group filling `bounds`. */
  render(ctx: DesignContext, bounds: Rect): SVGElement;
}

/**
 * Everything a composition or generator needs. Defined as an interface here to
 * avoid import cycles; the concrete implementation lives in context.ts.
 */
export interface DesignContext {
  readonly rng: Rng;
  readonly width: number;
  readonly height: number;
  readonly palette: Palette;
  readonly text: TextSettings;
  /** The root <svg> element being built. */
  readonly root: SVGSVGElement;

  /** The full-canvas rectangle. */
  bounds(): Rect;
  /** Creates an SVG element with attributes set. */
  el<K extends keyof SVGElementTagNameMap>(
    tag: K,
    attrs?: Record<string, string | number>,
  ): SVGElementTagNameMap[K];
  /** Creates a <g> group, optionally appended to a parent. */
  group(parent?: SVGElement): SVGGElement;
  /**
   * Stamps a generator into the given region. With `name`, uses that exact
   * generator; otherwise picks a random one, optionally restricted to a
   * `category` (e.g. 'object' for the 3D solids).
   */
  fillRegion(bounds: Rect, parent?: SVGElement, name?: string, category?: string): SVGElement;
}
