/** Rectangle and point helpers in SVG user units. */
import {Point, Rect} from '../core/types.js';

export const GOLDEN = 1.618033988749895;

/** Shrinks a rect by `amount` on every side (or per-axis). */
export function inset(r: Rect, amount: number, amountY = amount): Rect {
  return {
    x: r.x + amount,
    y: r.y + amountY,
    w: r.w - amount * 2,
    h: r.h - amountY * 2,
  };
}

/** Center point of a rect. */
export function center(r: Rect): Point {
  return {x: r.x + r.w / 2, y: r.y + r.h / 2};
}

/** Splits a rect horizontally at fraction `t` into [left, right]. */
export function splitX(r: Rect, t: number): [Rect, Rect] {
  const w = r.w * t;
  return [
    {x: r.x, y: r.y, w, h: r.h},
    {x: r.x + w, y: r.y, w: r.w - w, h: r.h},
  ];
}

/** Splits a rect vertically at fraction `t` into [top, bottom]. */
export function splitY(r: Rect, t: number): [Rect, Rect] {
  const h = r.h * t;
  return [
    {x: r.x, y: r.y, w: r.w, h},
    {x: r.x, y: r.y + h, w: r.w, h: r.h - h},
  ];
}

/** Divides a rect into `n` equal columns. */
export function columns(r: Rect, n: number, gap = 0): Rect[] {
  const w = (r.w - gap * (n - 1)) / n;
  const out: Rect[] = [];
  for (let i = 0; i < n; i++) {
    out.push({x: r.x + i * (w + gap), y: r.y, w, h: r.h});
  }
  return out;
}

/** Divides a rect into `n` equal rows. */
export function rows(r: Rect, n: number, gap = 0): Rect[] {
  const h = (r.h - gap * (n - 1)) / n;
  const out: Rect[] = [];
  for (let i = 0; i < n; i++) {
    out.push({x: r.x, y: r.y + i * (h + gap), w: r.w, h});
  }
  return out;
}

/** True if a point lies inside a rect. */
export function contains(r: Rect, p: Point): boolean {
  return p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h;
}

/** Clamps a value to [min, max]. */
export function clamp(v: number, min: number, max: number): number {
  return v < min ? min : v > max ? max : v;
}

/** Linear interpolation. */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** Formats a rect as an SVG path "M..Z" for clip paths and outlines. */
export function rectPath(r: Rect): string {
  return `M${r.x} ${r.y} h${r.w} v${r.h} h${-r.w} Z`;
}
