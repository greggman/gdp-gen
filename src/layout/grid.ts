/** Grid and proportion helpers built on rectangles. */
import {Rng} from '../core/rng.js';
import {Rect} from '../core/types.js';
import {columns, GOLDEN, rows} from './geometry.js';

/** A regular grid of cells, row-major. */
export function gridCells(r: Rect, cols: number, rowCount: number, gap = 0): Rect[] {
  const cells: Rect[] = [];
  for (const row of rows(r, rowCount, gap)) {
    cells.push(...columns(row, cols, gap));
  }
  return cells;
}

/** The three rule-of-thirds line positions along a length. */
export function thirds(length: number): [number, number] {
  return [length / 3, (length * 2) / 3];
}

/** A golden-ratio split point along a length (from the start). */
export function goldenSplit(length: number): number {
  return length / GOLDEN;
}

/**
 * A modular type scale: returns `steps` sizes growing by `ratio` from `base`.
 * Common ratios: 1.2 (minor third), 1.333 (perfect fourth), 1.618 (golden).
 */
export function modularScale(base: number, ratio: number, steps: number): number[] {
  const out: number[] = [];
  for (let i = 0; i < steps; i++) out.push(base * ratio ** i);
  return out;
}

/** Picks a pleasing column count weighted toward classic grid sizes. */
export function pickColumnCount(rng: Rng): number {
  return rng.weighted([2, 3, 4, 5, 6, 12], [3, 5, 5, 2, 3, 1]);
}
