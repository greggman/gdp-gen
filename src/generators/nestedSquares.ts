/**
 * Nested squares: each grid cell holds a stack of concentric squares, each one
 * smaller and rotated a little from the last, producing a hypnotic spiral-box
 * vortex per cell. Colors cycle through the palette as the squares shrink.
 */
import {registerGenerator} from '../core/registry.js';
import {Color, DesignContext, Rect} from '../core/types.js';
import {baseFill, clipped, palettePair, svgEl} from './_generator.js';

function squarePoints(cx: number, cy: number, half: number, deg: number): string {
  const a = (deg * Math.PI) / 180;
  const cos = Math.cos(a);
  const sin = Math.sin(a);
  const corners: Array<[number, number]> = [
    [-half, -half], [half, -half], [half, half], [-half, half],
  ];
  return corners
    .map(([dx, dy]) =>
      `${(cx + dx * cos - dy * sin).toFixed(2)},${(cy + dx * sin + dy * cos).toFixed(2)}`,
    )
    .join(' ');
}

function render(ctx: DesignContext, bounds: Rect): SVGElement {
  const {rng, palette} = ctx;
  const {bg, fg} = palettePair(ctx, rng);
  const g = clipped(ctx, bounds);
  baseFill(g, bounds, bg);

  const tones: Color[] = [fg, palette.primary, palette.accent, bg];
  const cols = rng.int(2, 6);
  const cell = bounds.w / cols;
  const rows = Math.ceil(bounds.h / cell);
  const depth = rng.int(4, 8);
  const shrink = rng.range(0.74, 0.86);
  const twist = rng.range(8, 22) * (rng.chance(0.5) ? 1 : -1);

  // Budget check: cols*rows*depth squares.
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cx = bounds.x + (c + 0.5) * cell;
      const cy = bounds.y + (r + 0.5) * cell;
      let half = (cell / 2) * 0.96;
      let deg = (r + c) % 2 === 0 ? 0 : twist / 2;
      for (let d = 0; d < depth && half > 1; d++) {
        const fill = tones[d % tones.length];
        g.appendChild(svgEl('polygon', {points: squarePoints(cx, cy, half, deg), fill}));
        half *= shrink;
        deg += twist;
      }
    }
  }
  return g;
}

registerGenerator({name: 'nested-squares', category: 'tiling', weight: 2, render});
