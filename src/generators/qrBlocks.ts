/**
 * QR blocks: a QR-code-like matrix of random filled cells, complete with the
 * three large finder squares in the corners and a quiet-zone margin. The data
 * area is filled at roughly 50% density so it reads as a scannable code without
 * actually encoding anything.
 */
import {registerGenerator} from '../core/registry.js';
import {DesignContext, Rect} from '../core/types.js';
import {baseFill, clipped, palettePair, svgEl} from './_generator.js';

function render(ctx: DesignContext, bounds: Rect): SVGElement {
  const {rng} = ctx;
  const {bg, fg} = palettePair(ctx, rng);
  const g = clipped(ctx, bounds);
  baseFill(g, bounds, bg);

  // Square module grid sized to fit; small quiet-zone margin.
  const modules = rng.pick([21, 25, 29, 33]);
  const margin = 2;
  const total = modules + margin * 2;
  const cell = Math.min(bounds.w, bounds.h) / total;
  const gridSize = cell * modules;
  const ox = bounds.x + (bounds.w - gridSize) / 2;
  const oy = bounds.y + (bounds.h - gridSize) / 2;

  // Finder pattern footprint is 7x7 in the three corners (+ separator).
  const finders = [
    [0, 0],
    [modules - 7, 0],
    [0, modules - 7],
  ];
  const inFinder = (r: number, c: number): boolean => {
    for (const [fr, fc] of finders) {
      if (r >= fr - 1 && r <= fr + 7 && c >= fc - 1 && c <= fc + 7) return true;
    }
    return false;
  };

  const density = rng.range(0.42, 0.55);
  let d = '';
  const addCell = (r: number, c: number) => {
    const x = (ox + c * cell).toFixed(2);
    const y = (oy + r * cell).toFixed(2);
    const s = cell.toFixed(2);
    d += `M${x} ${y}h${s}v${s}h-${s}z`;
  };

  for (let r = 0; r < modules; r++) {
    for (let c = 0; c < modules; c++) {
      if (inFinder(r, c)) continue;
      if (rng.chance(density)) addCell(r, c);
    }
  }

  // Draw the three finder patterns: 7x7 ring with a 3x3 solid center.
  for (const [fr, fc] of finders) {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        const ring = r === 0 || r === 6 || c === 0 || c === 6;
        const core = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        if (ring || core) addCell(fr + r, fc + c);
      }
    }
  }
  g.appendChild(svgEl('path', {d, fill: fg}));
  return g;
}

registerGenerator({name: 'qr-blocks', category: 'digital', weight: 2, render});
