/** Concrete DesignContext implementation passed to compositions/generators. */
import {Rng} from './rng.js';
import {DesignContext, Palette, Rect, TextSettings} from './types.js';
import {svgEl} from './renderer.js';
import {getGenerator, pickGenerator} from './registry.js';

export interface ContextOptions {
  rng: Rng;
  width: number;
  height: number;
  palette: Palette;
  text: TextSettings;
  root: SVGSVGElement;
}

/** Implements the helpers compositions and generators rely on. */
export class Context implements DesignContext {
  readonly rng: Rng;
  readonly width: number;
  readonly height: number;
  readonly palette: Palette;
  readonly text: TextSettings;
  readonly root: SVGSVGElement;

  constructor(opts: ContextOptions) {
    this.rng = opts.rng;
    this.width = opts.width;
    this.height = opts.height;
    this.palette = opts.palette;
    this.text = opts.text;
    this.root = opts.root;
  }

  bounds(): Rect {
    return {x: 0, y: 0, w: this.width, h: this.height};
  }

  el<K extends keyof SVGElementTagNameMap>(
    tag: K,
    attrs?: Record<string, string | number>,
  ): SVGElementTagNameMap[K] {
    return svgEl(tag, attrs);
  }

  group(parent?: SVGElement): SVGGElement {
    const g = svgEl('g');
    (parent ?? this.root).appendChild(g);
    return g;
  }

  fillRegion(bounds: Rect, parent?: SVGElement, name?: string): SVGElement {
    const gen = name ? getGenerator(name) : safePick(this.rng);
    let node: SVGElement;
    if (gen) {
      node = gen.render(this, bounds);
    } else {
      // Phase-1 fallback before generators exist: a flat fill.
      node = svgEl('rect', {
        x: bounds.x,
        y: bounds.y,
        width: bounds.w,
        height: bounds.h,
        fill: this.palette.primary,
      });
    }
    (parent ?? this.root).appendChild(node);
    return node;
  }
}

function safePick(rng: Rng) {
  try {
    return pickGenerator(rng);
  } catch {
    return undefined;
  }
}
