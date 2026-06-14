/**
 * Impossible isometric stairs: a Penrose-style staircase loop drawn as a ring
 * of iso steps that appears to ascend forever. The whole field is tiled with a
 * repeated step motif so it fills the region, with one bold central loop.
 */
import {registerGenerator} from '../core/registry.js';
import {DesignContext, Palette, Rect} from '../core/types.js';
import {baseFill, clipped, palettePair, svgEl} from './_generator.js';

function midColor(palette: Palette, bg: string, fg: string): string {
  for (const c of [palette.accent, palette.primary, palette.background]) {
    if (c !== bg && c !== fg) return c;
  }
  return fg;
}

function render(ctx: DesignContext, bounds: Rect): SVGElement {
  const {rng, palette} = ctx;
  const {bg, fg} = palettePair(ctx, rng);
  const mid = midColor(palette, bg, fg);
  const g = clipped(ctx, bounds);
  baseFill(g, bounds, bg);

  // A single step block: top face, left face, front face (a small iso cube
  // with a raised tread) tiled diagonally to fill the rect, climbing upward.
  const cols = rng.int(5, 9);
  const u = bounds.w / cols; // unit step run.
  const hw = u / 2;
  const qh = hw * 0.5774; // tan(30deg).
  const rise = hw * 0.85; // how much each step lifts.

  const topFace = (x: number, y: number): string =>
    `M${x.toFixed(1)} ${y.toFixed(1)}` +
    `l${hw.toFixed(1)} ${(-qh).toFixed(1)}` +
    `l${hw.toFixed(1)} ${qh.toFixed(1)}` +
    `l${(-hw).toFixed(1)} ${qh.toFixed(1)}z`;
  const leftFace = (x: number, y: number): string =>
    `M${x.toFixed(1)} ${y.toFixed(1)}` +
    `l${hw.toFixed(1)} ${qh.toFixed(1)}` +
    `l0 ${rise.toFixed(1)}` +
    `l${(-hw).toFixed(1)} ${(-qh).toFixed(1)}z`;
  const rightFace = (x: number, y: number): string =>
    `M${(x + hw).toFixed(1)} ${(y + qh).toFixed(1)}` +
    `l${hw.toFixed(1)} ${(-qh).toFixed(1)}` +
    `l0 ${rise.toFixed(1)}` +
    `l${(-hw).toFixed(1)} ${qh.toFixed(1)}z`;

  let dTop = '';
  let dLeft = '';
  let dRight = '';
  // Diagonal staircases marching down-right and lifting up each unit, repeated
  // across enough diagonals to blanket the whole region.
  const diagCount = cols + Math.ceil(bounds.h / (qh + rise)) + 4;
  for (let s = -diagCount; s < diagCount; s++) {
    const startX = bounds.x + s * u - bounds.w;
    const startY = bounds.y + bounds.h + 2 * (qh + rise);
    for (let step = 0; step < cols * 2 + 6; step++) {
      const x = startX + step * hw;
      const y = startY - step * (qh + rise);
      if (x > bounds.x + bounds.w + u) break;
      if (y < bounds.y - rise * 2) break;
      if (x < bounds.x - u || y > bounds.y + bounds.h + rise) continue;
      dLeft += leftFace(x, y);
      dRight += rightFace(x, y);
      dTop += topFace(x, y);
    }
  }
  g.appendChild(svgEl('path', {d: dRight, fill: mid}));
  g.appendChild(svgEl('path', {d: dLeft, fill: fg}));
  g.appendChild(svgEl('path', {d: dTop, fill: bg, stroke: fg, 'stroke-width': 1}));
  return g;
}

registerGenerator({name: 'isometric-stairs', category: 'geometric', weight: 2, render});
