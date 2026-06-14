/**
 * Isometric cube field: a grid of cubes drawn in 2:1 isometric projection,
 * each with a top, left and right face shaded as bg / fg / a midtone so the
 * field reads as solid stacked blocks.
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

  // Cube tile size; w = full diamond width, half-height h = w/2 * tan(30).
  const cols = rng.int(5, 10);
  const w = bounds.w / cols;
  const hw = w / 2;
  const qh = hw * 0.5774; // tan(30deg): the vertical offset of an iso edge.
  const cubeH = hw * 1.0; // vertical extent of a side face.

  const top = (x: number, y: number): string =>
    `M${x.toFixed(1)} ${y.toFixed(1)}` +
    `l${hw.toFixed(1)} ${(-qh).toFixed(1)}` +
    `l${hw.toFixed(1)} ${qh.toFixed(1)}` +
    `l${(-hw).toFixed(1)} ${qh.toFixed(1)}z`;
  const left = (x: number, y: number): string =>
    `M${x.toFixed(1)} ${y.toFixed(1)}` +
    `l${hw.toFixed(1)} ${qh.toFixed(1)}` +
    `l0 ${cubeH.toFixed(1)}` +
    `l${(-hw).toFixed(1)} ${(-qh).toFixed(1)}z`;
  const right = (x: number, y: number): string =>
    `M${(x + hw).toFixed(1)} ${(y + qh).toFixed(1)}` +
    `l${hw.toFixed(1)} ${(-qh).toFixed(1)}` +
    `l0 ${cubeH.toFixed(1)}` +
    `l${(-hw).toFixed(1)} ${qh.toFixed(1)}z`;

  // Step the iso grid by half-diamonds so cubes interlock and cover the rect.
  const stepX = hw;
  const stepY = qh + cubeH;
  let dTop = '';
  let dLeft = '';
  let dRight = '';
  for (let row = -2; row * (stepY / 2) < bounds.h + cubeH; row++) {
    const yBase = bounds.y + row * (qh);
    const offset = (row & 1) === 1 ? hw : 0;
    for (let col = -1; col * w + offset < bounds.w + w; col++) {
      const x = bounds.x + col * w + offset - hw;
      const y = yBase;
      if (y > bounds.y + bounds.h + cubeH) continue;
      dTop += top(x, y);
      dLeft += left(x, y);
      dRight += right(x, y);
    }
  }
  void stepX;
  g.appendChild(svgEl('path', {d: dLeft, fill: fg}));
  g.appendChild(svgEl('path', {d: dRight, fill: mid}));
  g.appendChild(svgEl('path', {d: dTop, fill: bg, stroke: fg, 'stroke-width': 1}));
  return g;
}

registerGenerator({name: 'isometric-blocks', category: 'geometric', weight: 2, render});
